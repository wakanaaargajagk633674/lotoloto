import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildCarryoverRows, buildLotoAnalysis, buildPrizeRows } from "../src/loto/analysis";
import { serializeJapaneseDrawsCsv, serializeNumberFrequencyCsv, serializeObjectsCsv, serializeRecent100Csv } from "../src/loto/csvExport";
import type { Draw, GameType } from "../src/loto/types";

async function readDraws(game: GameType): Promise<Draw[]> {
  return JSON.parse(await readFile(path.join("data", "processed", `${game}_draws.json`), "utf8")) as Draw[];
}

async function main() {
  await mkdir(path.join("data", "analysis"), { recursive: true });
  for (const game of ["loto6", "loto7"] as GameType[]) {
    const draws = await readDraws(game);
    const analysis = buildLotoAnalysis(game, draws);
    await writeFile(path.join("data", "analysis", `${game}_analysis.json`), `${JSON.stringify(analysis, null, 2)}\n`, "utf8");
    await writeFile(path.join("data", "analysis", `${game}_draws_japanese.csv`), serializeJapaneseDrawsCsv(draws), "utf8");
    await writeFile(path.join("data", "analysis", `${game}_number_frequency.csv`), serializeNumberFrequencyCsv(analysis.numberAnalysis), "utf8");
    await writeFile(path.join("data", "analysis", `${game}_recent100.csv`), serializeRecent100Csv(analysis.numberAnalysis), "utf8");
    await writeFile(
      path.join("data", "analysis", `${game}_carryover.csv`),
      serializeObjectsCsv(
        ["回号", "抽せん日", "販売実績額", "キャリーオーバー", "1等口数", "1等当せん金額"],
        buildCarryoverRows(draws),
        [(row) => row.drawNumber, (row) => row.drawDate, (row) => row.salesAmount ?? "", (row) => row.carryoverAmount ?? "", (row) => row.firstPrizeWinners ?? "", (row) => row.firstPrizeYen ?? ""]
      ),
      "utf8"
    );
    await writeFile(
      path.join("data", "analysis", `${game}_prize_tiers.csv`),
      serializeObjectsCsv(
        ["回号", "抽せん日", "等級", "当せん口数", "当せん金額"],
        buildPrizeRows(draws),
        [(row) => row.drawNumber, (row) => row.drawDate, (row) => `${row.tier}等`, (row) => row.winners ?? "", (row) => row.prizeYen ?? ""]
      ),
      "utf8"
    );
    console.log(`${game}: analysis generated for ${draws.length} draws`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
