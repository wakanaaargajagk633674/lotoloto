import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildTrendData, group6Defs, groupFineDefs, patternName } from "@/loto/trends";
import type { Draw, GameType } from "@/loto/types";

function loadDraws(game: GameType): Draw[] {
  return JSON.parse(readFileSync(`data/processed/${game}_draws.json`, "utf8")) as Draw[];
}

describe("trend tables", () => {
  it("splits numbers into sougaku-style groups", () => {
    expect(group6Defs("loto7").map((def) => `${def.from}-${def.to}`)).toEqual(["1-6", "7-12", "13-18", "19-24", "25-30", "31-37"]);
    expect(group6Defs("loto6").map((def) => `${def.from}-${def.to}`)).toEqual(["1-7", "8-14", "15-21", "22-28", "29-35", "36-43"]);
    expect(groupFineDefs("loto7")).toHaveLength(9);
    expect(groupFineDefs("loto7").at(-1)).toEqual({ key: "9", from: 33, to: 37 });
    expect(groupFineDefs("loto6")).toHaveLength(11);
    expect(groupFineDefs("loto6").at(-1)).toEqual({ key: "11", from: 41, to: 43 });
  });

  it("names winning patterns like the reference table", () => {
    expect(patternName({ A: 3, B: 2, C: 1, D: 1 })).toBe("フルハウス");
    expect(patternName({ A: 2, B: 2, C: 2, D: 1 })).toBe("スリーペア");
    expect(patternName({ A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 })).toBe("ペア無し");
    expect(patternName({ A: 4, B: 1, C: 1, D: 1 })).toBe("フォーカード");
  });

  for (const game of ["loto6", "loto7"] as GameType[]) {
    it(`builds consistent rows and a bounded narrowing for ${game}`, () => {
      const draws = loadDraws(game);
      const data = buildTrendData(game, draws);
      const latest = draws.at(-1)!;
      expect(data.rows[0].drawNumber).toBe(latest.drawNumber);
      expect(data.rows.length).toBeLessThanOrEqual(100);
      expect(data.rows[0].group6Code).toHaveLength(latest.mainNumbers.length + latest.bonusNumbers.length);
      expect(data.rows[0].oddCount).toBe(latest.mainNumbers.filter((n) => n % 2 === 1).length);
      const stats50 = data.stats[1];
      expect(stats50.drawCount).toBe(50);
      expect(stats50.mainCounts.slice(1).reduce((a, b) => a + b, 0)).toBe(50 * latest.mainNumbers.length);

      const { narrowing } = data;
      expect(narrowing.targetDrawNumber).toBe(latest.drawNumber + 1);
      expect(narrowing.selected.length).toBeLessThanOrEqual(25);
      expect(narrowing.selected.length + narrowing.removed.length).toBe(data.stats[0].mainCounts.length - 1);
      for (const value of Object.values(narrowing.selectedByGroup6)) expect(value).toBeGreaterThan(0);
      for (const value of Object.values(narrowing.selectedByGroupFine)) expect(value).toBeGreaterThan(0);
      expect(narrowing.selected.filter((entry) => entry.inPreviousDraw).length).toBeLessThanOrEqual(2);
      const pool = new Set(narrowing.selected.map((entry) => entry.number));
      for (const ticket of narrowing.sampleTickets) {
        expect(ticket.numbers).toHaveLength(latest.mainNumbers.length);
        expect(new Set(ticket.numbers).size).toBe(ticket.numbers.length);
        for (const number of ticket.numbers) expect(pool.has(number)).toBe(true);
      }
    });
  }
});
