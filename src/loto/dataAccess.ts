import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LotoAnalysis } from "./analysis";
import type { BacktestSummary, Draw, GameType } from "./types";

export type DownloadManifestEntry = {
  fileName: string;
  bomFileName: string;
  game: string;
  title: string;
  description: string;
};

export async function loadDraws(game: GameType): Promise<Draw[]> {
  return readJson<Draw[]>(path.join("data", "processed", `${game}_draws.json`), []);
}

export async function loadAnalysis(game: GameType): Promise<LotoAnalysis | null> {
  return readJson<LotoAnalysis | null>(path.join("data", "analysis", `${game}_analysis.json`), null);
}

export async function loadBacktest(game: GameType): Promise<BacktestSummary | undefined> {
  return readJson<BacktestSummary | undefined>(path.join("data", "backtest", "results", `${game}_backtest_summary.json`), undefined);
}

export async function loadDownloadManifest(): Promise<DownloadManifestEntry[]> {
  return readJson<DownloadManifestEntry[]>(path.join("public", "downloads", "download-manifest.json"), []);
}

async function readJson<T>(relativePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), relativePath), "utf8")) as T;
  } catch {
    return fallback;
  }
}
