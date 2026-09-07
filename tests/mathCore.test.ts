import { describe, expect, it } from "vitest";
import {
  chiSquareUniformity,
  combinations,
  estimateTicketVolumes,
  expectedJackpotPayout,
  fitPopularityRegression,
  matchProbability,
  regularizedLowerGamma,
  shrinkFrequencies,
  tripleCoverageRatio
} from "@/loto/mathCore";
import { createSeededRandom } from "@/loto/random";
import type { Draw } from "@/loto/types";

function uniformCounts(seed: number, draws: number): Map<number, number> {
  const random = createSeededRandom(seed);
  const counts = new Map<number, number>();
  for (let draw = 0; draw < draws; draw += 1) {
    const picked = new Set<number>();
    while (picked.size < 6) {
      picked.add(Math.floor(random() * 43) + 1);
    }
    for (const number of picked) {
      counts.set(number, (counts.get(number) ?? 0) + 1);
    }
  }
  return counts;
}

/** 数字ごとの人気度 popularity を仮定し、3個一致口数がそれに比例して増える合成データを作る。 */
function syntheticDraws(popularity: (n: number) => number, count: number, seed = 3): Draw[] {
  const random = createSeededRandom(seed);
  const volume = 5_000_000;
  const p3 = matchProbability("loto6", 3);
  return Array.from({ length: count }, (_, index) => {
    const picked = new Set<number>();
    while (picked.size < 6) {
      picked.add(Math.floor(random() * 43) + 1);
    }
    const mainNumbers = [...picked].sort((a, b) => a - b);
    const effect = Math.exp(mainNumbers.reduce((sum, number) => sum + Math.log(popularity(number)), 0) / 2);
    const winners = Math.round(volume * p3 * effect * (0.97 + random() * 0.06));
    return {
      game: "loto6",
      drawNumber: index + 1,
      drawDate: "2024-01-01",
      dayOfWeek: null,
      mainNumbers,
      bonusNumbers: [],
      salesAmount: null,
      carryoverAmount: 0,
      prizeTiers: [
        { tier: 1, winners: 0, prizeYen: 0 },
        { tier: 2, winners: 0, prizeYen: 0 },
        { tier: 3, winners: 0, prizeYen: 0 },
        { tier: 4, winners: 0, prizeYen: 0 },
        { tier: 5, winners, prizeYen: 1000 }
      ],
      source: "test",
      sourceDownloadedAt: null,
      sourceHash: null
    };
  });
}

describe("combinatorics", () => {
  it("matches the official first prize odds", () => {
    expect(combinations(43, 6)).toBe(6_096_454);
    expect(combinations(37, 7)).toBe(10_295_472);
    expect(matchProbability("loto6", 6)).toBeCloseTo(1 / 6_096_454, 12);
  });

  it("evaluates the chi-square cdf at known points", () => {
    // P(chi2_2 <= 2 ln 2) = 0.5 は閉形式で確認できる。
    expect(regularizedLowerGamma(1, Math.log(2))).toBeCloseTo(0.5, 6);
    expect(regularizedLowerGamma(21, 21)).toBeGreaterThan(0.4);
    expect(regularizedLowerGamma(21, 21)).toBeLessThan(0.6);
  });
});

describe("uniformity and shrinkage", () => {
  it("does not reject uniform draws and shrinks frequencies back to uniform", () => {
    const counts = uniformCounts(11, 2000);
    const test = chiSquareUniformity(counts, "loto6", 2000);
    expect(test.degreesOfFreedom).toBe(42);
    expect(test.pValue).toBeGreaterThan(0.01);
    const shrink = shrinkFrequencies(counts, "loto6", 2000);
    expect(shrink.lambda).toBeLessThan(0.5);
    for (const value of shrink.posterior.values()) {
      expect(Math.abs(value - 6 / 43)).toBeLessThan(0.02);
    }
  });

  it("keeps a real bias when the data is far from uniform", () => {
    const counts = uniformCounts(5, 2000);
    counts.set(7, (counts.get(7) ?? 0) + 400);
    const shrink = shrinkFrequencies(counts, "loto6", 2000);
    expect(shrink.test.pValue).toBeLessThan(0.001);
    expect(shrink.lambda).toBeGreaterThan(0.5);
    expect(shrink.posterior.get(7)!).toBeGreaterThan(6 / 43);
  });
});

describe("popularity regression", () => {
  it("recovers ticket volume and ranks planted popular numbers first", () => {
    const popular = new Set([3, 7, 8, 11, 12]);
    const draws = syntheticDraws((n) => (popular.has(n) ? 1.6 : n > 31 ? 0.7 : 1), 600);
    const volumes = estimateTicketVolumes("loto6", draws);
    const latest = volumes.get(draws.at(-1)!.drawNumber)!;
    expect(latest).toBeGreaterThan(3_500_000);
    expect(latest).toBeLessThan(7_500_000);

    const regression = fitPopularityRegression("loto6", draws);
    expect(regression).not.toBeNull();
    const ranked = [...regression!.beta.entries()].sort((a, b) => b[1] - a[1]).map(([number]) => number);
    expect(ranked.slice(0, 5).filter((number) => popular.has(number)).length).toBeGreaterThanOrEqual(4);
    expect(regression!.beta.get(43)!).toBeLessThan(regression!.beta.get(7)!);
  });

  it("returns null without enough observations", () => {
    expect(fitPopularityRegression("loto6", syntheticDraws(() => 1, 10))).toBeNull();
  });
});

describe("expected jackpot payout", () => {
  it("pays more when fewer co-winners are expected", () => {
    const beta = new Map<number, number>([
      [1, 0.3],
      [2, 0.3],
      [3, 0.3],
      [41, -0.3],
      [42, -0.3],
      [43, -0.3]
    ]);
    const crowded = expectedJackpotPayout("loto6", [1, 2, 3, 4, 5, 6], beta, 7_000_000);
    const spread = expectedJackpotPayout("loto6", [4, 5, 6, 41, 42, 43], beta, 7_000_000);
    expect(crowded.relativePopularity).toBeGreaterThan(1);
    expect(spread.relativePopularity).toBeLessThan(1);
    expect(spread.payoutFactor).toBeGreaterThan(crowded.payoutFactor);
    expect(spread.payoutFactor).toBeLessThanOrEqual(1);
    // E[1/(1+X)] for Poisson(m) は (1 - e^-m) / m。
    const m = crowded.expectedCoWinners;
    expect(crowded.payoutFactor).toBeCloseTo((1 - Math.exp(-m)) / m, 10);
  });

  it("is neutral when no regression is available", () => {
    const result = expectedJackpotPayout("loto6", [1, 2, 3, 4, 5, 6], null, 7_000_000);
    expect(result.relativePopularity).toBe(1);
  });
});

describe("triple coverage", () => {
  it("is 1 for disjoint tickets and lower for overlapping ones", () => {
    expect(tripleCoverageRatio([[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]])).toBe(1);
    expect(tripleCoverageRatio([[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 7]])).toBeLessThan(1);
    expect(tripleCoverageRatio([[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]])).toBe(0.5);
  });
});
