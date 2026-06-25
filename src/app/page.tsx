import { readFile } from "node:fs/promises";
import path from "node:path";
import LotoApp from "@/components/LotoApp";
import type { BacktestSummary, Draw, GameType } from "@/loto/types";

async function loadDraws(game: GameType): Promise<Draw[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "processed", `${game}_draws.json`), "utf8");
    return JSON.parse(raw) as Draw[];
  } catch {
    return [];
  }
}

async function loadBacktest(game: GameType): Promise<BacktestSummary | undefined> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "backtest", "results", `${game}_backtest_summary.json`), "utf8");
    return JSON.parse(raw) as BacktestSummary;
  } catch {
    return undefined;
  }
}

export default async function Page() {
  const [loto6Draws, loto7Draws] = await Promise.all([loadDraws("loto6"), loadDraws("loto7")]);
  const [loto6Backtest, loto7Backtest] = await Promise.all([loadBacktest("loto6"), loadBacktest("loto7")]);
  return (
    <LotoApp
      initialDraws={{ loto6: loto6Draws, loto7: loto7Draws }}
      backtests={{ loto6: loto6Backtest, loto7: loto7Backtest }}
    />
  );
}
