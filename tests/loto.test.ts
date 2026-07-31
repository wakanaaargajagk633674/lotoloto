import { describe, expect, it } from "vitest";
import {
  NARRATIVE_SIGNAL_BUDGET,
  narrativeSignalMagnitude,
  strategyWeights,
  weightMagnitude
} from "@/config/strategyWeights";
import { buildPopularityModel, priorPopularityScore, scoreCombinationPopularity } from "@/loto/popularity";
import { runWalkForwardBacktest } from "@/loto/backtest";
import { downloadLotoZipWithFallback } from "@/loto/downloader";
import { generateTickets } from "@/loto/generator";
import { parseLotoCsvText } from "@/loto/parser";
import { scoreCombination } from "@/loto/scoring";
import type { Draw, GameType } from "@/loto/types";

function makeDraws(game: GameType, count: number): Draw[] {
  const max = game === "loto6" ? 43 : 37;
  const mainCount = game === "loto6" ? 6 : 7;
  const bonusCount = game === "loto6" ? 1 : 2;
  return Array.from({ length: count }, (_, index) => {
    const numbers: number[] = [];
    let cursor = index + 1;
    while (numbers.length < mainCount) {
      const value = ((cursor * 7) % max) + 1;
      if (!numbers.includes(value)) {
        numbers.push(value);
      }
      cursor += 1;
    }
    const bonusNumbers: number[] = [];
    while (bonusNumbers.length < bonusCount) {
      const value = ((cursor * 11) % max) + 1;
      if (!numbers.includes(value) && !bonusNumbers.includes(value)) {
        bonusNumbers.push(value);
      }
      cursor += 1;
    }
    return {
      game,
      drawNumber: index + 1,
      drawDate: `2024-01-${String((index % 28) + 1).padStart(2, "0")}`,
      dayOfWeek: null,
      mainNumbers: numbers.sort((a, b) => a - b),
      bonusNumbers: bonusNumbers.sort((a, b) => a - b),
      salesAmount: null,
      carryoverAmount: index % 9 === 0 ? 1000 : 0,
      prizeTiers: Array.from({ length: game === "loto6" ? 5 : 6 }, (_, tierIndex) => ({
        tier: tierIndex + 1,
        winners: 0,
        prizeYen: tierIndex === 4 ? 1000 : 0
      })),
      source: "test",
      sourceDownloadedAt: null,
      sourceHash: null
    };
  });
}

function makeTestDraw(game: GameType, drawNumber: number, mainNumbers: number[], bonusNumbers: number[]): Draw {
  return {
    game,
    drawNumber,
    drawDate: `2024-02-${String(drawNumber).padStart(2, "0")}`,
    dayOfWeek: null,
    mainNumbers: [...mainNumbers].sort((a, b) => a - b),
    bonusNumbers: [...bonusNumbers].sort((a, b) => a - b),
    salesAmount: null,
    carryoverAmount: 0,
    prizeTiers: Array.from({ length: game === "loto6" ? 5 : 6 }, (_, tierIndex) => ({
      tier: tierIndex + 1,
      winners: 0,
      prizeYen: tierIndex === 4 ? 1000 : 0
    })),
    source: "test",
    sourceDownloadedAt: null,
    sourceHash: null
  };
}

describe("parser", () => {
  it("parses loto6 CSV rows", () => {
    const csv = [
      "抽せん回,抽せん日,曜日,本数字1,本数字2,本数字3,本数字4,本数字5,本数字6,ボーナス数字,1等口数,1等賞金,2等口数,2等賞金,3等口数,3等賞金,4等口数,4等賞金,5等口数,5等賞金,キャリーオーバー",
      "1,2000/10/5,木,2,8,10,13,27,30,39,2,45513600,2,40961900,262,375200,12413,6900,174452,1000,0"
    ].join("\n");
    const [draw] = parseLotoCsvText("loto6", csv, { source: "sample" });
    expect(draw.drawNumber).toBe(1);
    expect(draw.drawDate).toBe("2000-10-05");
    expect(draw.mainNumbers).toEqual([2, 8, 10, 13, 27, 30]);
    expect(draw.bonusNumbers).toEqual([39]);
  });
});

describe("generator", () => {
  it("generates loto6 numbers in range without duplicates", () => {
    const [ticket] = generateTickets(makeDraws("loto6", 80), { game: "loto6", strategy: "balance", ticketCount: 1, seed: 1 });
    expect(ticket.numbers).toHaveLength(6);
    expect(new Set(ticket.numbers).size).toBe(6);
    expect(ticket.numbers.every((number) => number >= 1 && number <= 43)).toBe(true);
  });

  it("generates loto7 numbers in range without duplicates", () => {
    const [ticket] = generateTickets(makeDraws("loto7", 80), { game: "loto7", strategy: "high_return", ticketCount: 1, seed: 2 });
    expect(ticket.numbers).toHaveLength(7);
    expect(new Set(ticket.numbers).size).toBe(7);
    expect(ticket.numbers.every((number) => number >= 1 && number <= 37)).toBe(true);
  });

  it("generates requested ticket count", () => {
    const tickets = generateTickets(makeDraws("loto6", 80), { game: "loto6", strategy: "smart_mix", ticketCount: 4, seed: 3 });
    expect(tickets).toHaveLength(4);
  });

  it("spreads multi-ticket portfolios without exact duplicate tickets", () => {
    const tickets = generateTickets(makeDraws("loto6", 120), { game: "loto6", strategy: "smart_mix", ticketCount: 20, seed: 606 });
    const keys = tickets.map((ticket) => ticket.numbers.join("-"));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is reproducible with a fixed seed", () => {
    const draws = makeDraws("loto6", 80);
    const a = generateTickets(draws, { game: "loto6", strategy: "pure_random", ticketCount: 3, seed: 99 });
    const b = generateTickets(draws, { game: "loto6", strategy: "pure_random", ticketCount: 3, seed: 99 });
    expect(a.map((ticket) => ticket.numbers)).toEqual(b.map((ticket) => ticket.numbers));
  });
});

describe("combination scoring", () => {
  it("scores previous-draw overlap as a soft distribution signal", () => {
    const history = [
      makeTestDraw("loto6", 1, [1, 2, 3, 4, 5, 6], [43]),
      makeTestDraw("loto6", 2, [1, 7, 8, 9, 10, 11], [42]),
      makeTestDraw("loto6", 3, [1, 12, 13, 14, 15, 16], [41]),
      makeTestDraw("loto6", 4, [1, 17, 18, 19, 20, 21], [40])
    ];
    const common = scoreCombination("loto6", "balance", [1, 22, 23, 24, 25, 26], [], history);
    const extreme = scoreCombination("loto6", "balance", [1, 17, 18, 19, 20, 21], [], history);

    expect(common.previousDrawOverlap).toBe(1);
    expect(common.previousDrawOverlapScore).toBeGreaterThan(extreme.previousDrawOverlapScore);
    expect(extreme.previousDrawOverlapBand).toBe("extreme");
  });
});

describe("weights", () => {
  it("keeps strategy weights finite and bounded", () => {
    for (const weights of Object.values(strategyWeights)) {
      expect(weightMagnitude(weights)).toBeGreaterThan(0);
      for (const value of Object.values(weights)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps evidence-light signals inside the narrative budget", () => {
    for (const weights of Object.values(strategyWeights)) {
      expect(narrativeSignalMagnitude(weights)).toBeLessThanOrEqual(NARRATIVE_SIGNAL_BUDGET);
    }
  });
});

describe("popularity model", () => {
  it("treats birthday-range numbers as more likely to be picked by buyers", () => {
    expect(priorPopularityScore("loto6", 7)).toBeGreaterThan(priorPopularityScore("loto6", 41));
    expect(priorPopularityScore("loto6", 12)).toBeGreaterThan(priorPopularityScore("loto6", 25));
  });

  it("only uses draws available at prediction time", () => {
    const draws = makeDraws("loto6", 400);
    const early = buildPopularityModel("loto6", draws.slice(0, 200));
    const late = buildPopularityModel("loto6", draws);
    expect(early.drawsUsed).toBe(200);
    expect(late.drawsUsed).toBe(400);
    expect(early.observationCount).toBeLessThanOrEqual(200);
  });

  it("scores birthday-only combinations as more likely to be shared", () => {
    const model = buildPopularityModel("loto6", makeDraws("loto6", 120));
    const crowded = scoreCombinationPopularity("loto6", [3, 7, 8, 11, 12, 22], model);
    const spread = scoreCombinationPopularity("loto6", [4, 17, 33, 34, 39, 42], model);
    expect(crowded.index).toBeGreaterThan(spread.index);
    expect(spread.expectedShareScore).toBeGreaterThan(crowded.expectedShareScore);
  });
});

describe("hit neutrality", () => {
  it("keeps every number reachable so the hit chance is not narrowed", () => {
    const draws = makeDraws("loto6", 200);
    const picked = new Set<number>();
    for (let seed = 0; seed < 60; seed += 1) {
      const tickets = generateTickets(draws, { game: "loto6", strategy: "balance", ticketCount: 3, seed });
      for (const ticket of tickets) {
        for (const number of ticket.numbers) {
          picked.add(number);
        }
      }
    }
    expect(picked.size).toBeGreaterThanOrEqual(38);
  });
});

describe("range band guard", () => {
  it("does not collapse into a numbers-over-31 only ticket", () => {
    const draws = makeDraws("loto6", 200);
    for (let seed = 0; seed < 30; seed += 1) {
      const tickets = generateTickets(draws, { game: "loto6", strategy: "high_return", ticketCount: 2, seed });
      for (const ticket of tickets) {
        expect(ticket.numbers.filter((number) => number <= 31).length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("backtest", () => {
  it("records walk-forward train draw before target draw", () => {
    const { detail } = runWalkForwardBacktest(makeDraws("loto6", 25), "loto6", {
      minTrainingDraws: 10,
      strategies: ["pure_random"],
      seed: 4
    });
    expect(detail.length).toBeGreaterThan(0);
    expect(detail.every((row) => row.trainThroughDraw < row.targetDraw)).toBe(true);
  });
});

describe("download fallback", () => {
  it("returns fallback metadata when sougaku download fails", async () => {
    const result = await downloadLotoZipWithFallback("loto6", process.cwd(), async () => {
      throw new Error("network blocked");
    });
    expect(result.ok).toBe(false);
    expect(result.fallbackReasons.join(" ")).toContain("network blocked");
    if (!result.ok) {
      expect(result.sourceUrl).toContain("sougaku.com");
    }
  });
});
