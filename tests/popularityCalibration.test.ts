import { describe, expect, it } from "vitest";
import { popularityCalibrationSettings } from "@/config/strategyWeights";
import { combinations } from "@/loto/mathCore";
import {
  buildPrizeBaselines,
  calibratedLogPopularity,
  expectedReturnForCombination,
  fitCalibratedPopularity,
  nestedJackpotValidation,
  TIER_DEFINITIONS,
  tierPopularityCoefficient,
  tierProbability,
  walkForwardPopularity
} from "@/loto/popularityCalibration";
import { createSeededRandom } from "@/loto/random";
import type { Draw } from "@/loto/types";

function poissonSample(mean: number, random: () => number): number {
  const limit = Math.exp(-mean);
  let k = 0;
  let product = random();
  while (product > limit) {
    k += 1;
    product *= random();
  }
  return k;
}

/**
 * 「数字ごとの対数人気度 γ」を仮定し、等級ごとの口数を理論式どおりに作った合成データ。
 * 低位等級は log(W/Np) = c_k Σγ、1等は Poisson(N/C · exp(Σγ))。
 */
function syntheticHistory(count: number, seed = 5): { draws: Draw[]; gamma: Map<number, number> } {
  const random = createSeededRandom(seed);
  const raw = Array.from({ length: 43 }, (_, index) => {
    const number = index + 1;
    return number <= 12 ? 0.25 : number <= 31 ? 0.05 : -0.3;
  });
  const average = raw.reduce((sum, value) => sum + value, 0) / raw.length;
  const gamma = new Map(raw.map((value, index) => [index + 1, value - average]));
  const volume = 12_000_000;
  const total = combinations(43, 6);
  const draws: Draw[] = Array.from({ length: count }, (_, index) => {
    const picked = new Set<number>();
    while (picked.size < 6) {
      picked.add(1 + Math.floor(random() * 43));
    }
    const mainNumbers = [...picked].sort((a, b) => a - b);
    const logPop = mainNumbers.reduce((sum, number) => sum + (gamma.get(number) ?? 0), 0);
    const prizeTiers = TIER_DEFINITIONS.loto6.map((definition) => {
      if (definition.tier === 1) {
        return { tier: 1, winners: poissonSample((volume / total) * Math.exp(logPop), random), prizeYen: 100_000_000 };
      }
      const expected = volume * tierProbability("loto6", definition);
      const winners = Math.max(1, Math.round(expected * Math.exp(tierPopularityCoefficient("loto6", definition.matches) * logPop) * (0.99 + random() * 0.02)));
      return { tier: definition.tier, winners, prizeYen: definition.tier === 5 ? 1000 : Math.round(1e8 / winners) };
    });
    return {
      game: "loto6",
      drawNumber: index + 1,
      drawDate: "2024-01-01",
      dayOfWeek: null,
      mainNumbers,
      bonusNumbers: [],
      salesAmount: null,
      carryoverAmount: 0,
      prizeTiers,
      source: "test",
      sourceDownloadedAt: null,
      sourceHash: null
    };
  });
  return { draws, gamma };
}

describe("tier arithmetic", () => {
  it("matches the official odds of every tier", () => {
    const odds = (game: "loto6" | "loto7", tier: number) =>
      1 / tierProbability(game, TIER_DEFINITIONS[game].find((definition) => definition.tier === tier)!);
    expect(odds("loto6", 1)).toBeCloseTo(6_096_454, 0);
    expect(Math.round(odds("loto6", 2))).toBe(1_016_076);
    expect(Math.round(odds("loto6", 3))).toBe(28_224);
    expect(Math.round(odds("loto6", 4))).toBe(610);
    expect(Math.round(odds("loto6", 5))).toBe(39);
    expect(Math.round(odds("loto7", 2))).toBe(735_391);
    expect(Math.round(odds("loto7", 3))).toBe(52_528);
    expect(Math.round(odds("loto7", 4))).toBe(1_127);
    expect(Math.round(odds("loto7", 5))).toBe(72);
    expect(Math.round(odds("loto7", 6))).toBe(42);
  });

  it("uses a coefficient of 1 for the jackpot and smaller ones for lower tiers", () => {
    expect(tierPopularityCoefficient("loto6", 6)).toBe(1);
    expect(tierPopularityCoefficient("loto6", 3)).toBeCloseTo(0.5 - 3 / 37, 12);
    expect(tierPopularityCoefficient("loto7", 4)).toBeCloseTo(4 / 7 - 3 / 30, 12);
  });
});

describe("calibrated popularity", () => {
  const { draws, gamma } = syntheticHistory(900);
  const settings = { ...popularityCalibrationSettings.loto6, warmup: 150 };

  it("recovers the planted popularity out of sample", () => {
    const result = walkForwardPopularity("loto6", draws, { trainTiers: [4, 5], evalTier: 5, ridge: 16, patterns: false, warmup: 150, refitEvery: 10 });
    expect(result.oosR2).toBeGreaterThan(0.5);
    expect(result.finalGamma.get(7)!).toBeGreaterThan(result.finalGamma.get(40)!);
    expect(Math.sign(result.finalGamma.get(3)!)).toBe(Math.sign(gamma.get(3)!));
  });

  it("finds a slope close to the theoretical value 1 on data built from the theory", () => {
    const model = fitCalibratedPopularity("loto6", draws, settings)!;
    expect(model).not.toBeNull();
    expect(model.slope).toBeGreaterThan(0.7);
    expect(model.slope).toBeLessThan(1.4);
    expect(model.trainedThroughDraw).toBe(900);
  });

  it("beats the no-popularity baseline in nested out-of-sample validation", () => {
    const validation = nestedJackpotValidation("loto6", draws, settings, { evalStart: 400, refitEvery: 25 });
    const calibrated = validation.rows.find((row) => row.label.startsWith("較正 s (並び"))!;
    expect(validation.evaluatedDraws).toBeGreaterThan(400);
    expect(calibrated.deltaLogLikelihood).toBeGreaterThan(0);
  });

  it("returns null while the history is shorter than the warm-up", () => {
    expect(fitCalibratedPopularity("loto6", draws.slice(0, 100), settings)).toBeNull();
  });

  it("expects a larger payout for less popular combinations and never exceeds the sole-winner pool", () => {
    const model = fitCalibratedPopularity("loto6", draws, settings)!;
    const baselines = buildPrizeBaselines("loto6", draws, 100);
    const crowded = expectedReturnForCombination("loto6", [1, 3, 5, 7, 9, 11], model, baselines, 12_000_000);
    const spread = expectedReturnForCombination("loto6", [4, 17, 33, 36, 40, 42], model, baselines, 12_000_000);
    expect(calibratedLogPopularity(model, [1, 3, 5, 7, 9, 11])).toBeGreaterThan(calibratedLogPopularity(model, [4, 17, 33, 36, 40, 42]));
    expect(spread.payoutFactor).toBeGreaterThan(crowded.payoutFactor);
    expect(spread.expectedReturnYen).toBeGreaterThan(crowded.expectedReturnYen);
    expect(spread.payoutFactor).toBeLessThanOrEqual(1);
  });
});
