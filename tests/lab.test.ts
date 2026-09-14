import { describe, expect, it } from "vitest";
import { benjaminiHochberg, buildAngles, hypergeometricMoments, LabState, runLab, runStructureChecks } from "@/loto/lab";
import { createSeededRandom, shuffleWithRandom } from "@/loto/random";
import type { Draw } from "@/loto/types";

function syntheticDraws(count: number, seed: number, bias?: (n: number) => number): Draw[] {
  const random = createSeededRandom(seed);
  const domain = Array.from({ length: 37 }, (_, i) => i + 1);
  return Array.from({ length: count }, (_, index) => {
    let pick: number[];
    if (bias) {
      // 重み付き非復元抽出で意図的な偏りを作る。
      pick = [];
      const pool = [...domain];
      while (pick.length < 7) {
        const weights = pool.map(bias);
        const total = weights.reduce((a, b) => a + b, 0);
        let r = random() * total;
        let chosen = pool.length - 1;
        for (let i = 0; i < pool.length; i += 1) {
          r -= weights[i];
          if (r <= 0) {
            chosen = i;
            break;
          }
        }
        pick.push(pool.splice(chosen, 1)[0]);
      }
    } else {
      pick = shuffleWithRandom(domain, random).slice(0, 7);
    }
    const rest = domain.filter((n) => !pick.includes(n));
    return {
      game: "loto7",
      drawNumber: index + 1,
      drawDate: "2020-01-01",
      dayOfWeek: null,
      mainNumbers: pick.sort((a, b) => a - b),
      bonusNumbers: shuffleWithRandom(rest, random).slice(0, 2),
      salesAmount: null,
      carryoverAmount: 0,
      prizeTiers: [],
      source: "test",
      sourceDownloadedAt: null,
      sourceHash: null
    };
  });
}

describe("lab", () => {
  it("hypergeometric moments match the loto7 baseline", () => {
    const { mean, std } = hypergeometricMoments("loto7");
    expect(mean).toBeCloseTo(49 / 37, 6);
    expect(std).toBeGreaterThan(0.9);
    expect(std).toBeLessThan(1.0);
  });

  it("Benjamini-Hochberg q values are monotone and bounded", () => {
    const q = benjaminiHochberg([0.001, 0.04, 0.2, 0.5, 0.9]);
    expect(q[0]).toBeCloseTo(0.005, 6);
    expect(q[1]).toBeCloseTo(0.1, 6);
    for (const value of q) expect(value).toBeLessThanOrEqual(1);
    expect(q[2]).toBeLessThanOrEqual(q[3]);
  });

  it("LabState window counts agree with a direct recount", () => {
    const draws = syntheticDraws(120, 3);
    const state = new LabState("loto7", [10]);
    for (const draw of draws) state.push(draw);
    const window = state.windowCount(30);
    const direct = new Map<number, number>();
    for (const draw of draws.slice(-30)) for (const n of draw.mainNumbers) direct.set(n, (direct.get(n) ?? 0) + 1);
    for (let n = 1; n <= 37; n += 1) expect(window[n]).toBe(direct.get(n) ?? 0);
    expect(state.currentGap(draws.at(-1)!.mainNumbers[0])).toBe(0);
  });

  it("every angle returns a finite score for every number", () => {
    const draws = syntheticDraws(60, 5);
    const state = new LabState("loto7", [5, 10, 20, 50]);
    for (const draw of draws) state.push(draw);
    const random = createSeededRandom(1);
    for (const angle of buildAngles("loto7")) {
      const scores = angle.score(state, { previous: draws.at(-1), index: draws.length, random });
      expect(scores).toHaveLength(38);
      for (let n = 1; n <= 37; n += 1) expect(Number.isFinite(scores[n])).toBe(true);
    }
  });

  it("uniform synthetic data yields no significant angle after BH correction", () => {
    const lab = runLab(syntheticDraws(400, 11), "loto7", { minTrainingDraws: 80, permutations: 0 });
    expect(lab.trials).toBe(320);
    expect(lab.angles.filter((a) => a.aucQ < 0.1)).toHaveLength(0);
    expect(Math.abs(lab.controlAucZ.mean)).toBeLessThan(1.5);
  });

  it("a planted hot-number bias is detected by the frequency angles", () => {
    const lab = runLab(
      syntheticDraws(500, 17, (n) => (n <= 8 ? 3 : 1)),
      "loto7",
      { minTrainingDraws: 80, permutations: 0 }
    );
    const hot = lab.angles.find((a) => a.id === "hot_all")!;
    const cold = lab.angles.find((a) => a.id === "cold_all")!;
    expect(hot.meanAuc).toBeGreaterThan(0.55);
    expect(hot.aucQ).toBeLessThan(0.01);
    expect(cold.meanAuc).toBeLessThan(0.45);
  });

  it("structure checks of uniform data are consistent with theory", () => {
    const checks = runStructureChecks(syntheticDraws(600, 23), "loto7", 20000);
    expect(checks).toHaveLength(6);
    expect(checks.filter((c) => c.pValue < 0.01)).toHaveLength(0);
  });
});
