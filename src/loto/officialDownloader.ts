import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import iconv from "iconv-lite";
import type { Draw, GameType, PrizeTier } from "./types";

const OFFICIAL_BASE = "https://www.mizuhobank.co.jp";

export const OFFICIAL_LOTO_URLS: Record<GameType, { currentPage: string; indexCsv: string; detailPrefix: string }> = {
  loto6: {
    currentPage: `${OFFICIAL_BASE}/takarakuji/check/loto/loto6/index.html`,
    indexCsv: `${OFFICIAL_BASE}/retail/takarakuji/loto/loto6/csv/loto6.csv`,
    detailPrefix: `${OFFICIAL_BASE}/retail/takarakuji/loto/loto6/csv/A102`
  },
  loto7: {
    currentPage: `${OFFICIAL_BASE}/takarakuji/check/loto/loto7/index.html`,
    indexCsv: `${OFFICIAL_BASE}/retail/takarakuji/loto/loto7/csv/loto7.csv`,
    detailPrefix: `${OFFICIAL_BASE}/retail/takarakuji/loto/loto7/csv/A103`
  }
};

type FetchResult = {
  url: string;
  status: number;
  ok: boolean;
  text: string;
  buffer: Buffer;
};

export type OfficialDownloadSummary = {
  game: GameType;
  downloadedAt: string;
  currentPageStatus: number;
  indexStatus: number;
  drawCount: number;
  firstDraw: number | null;
  latestDraw: number | null;
  rawDir: string;
  sourceUrls: string[];
};

export async function downloadOfficialLotoData(game: GameType, rootDir = process.cwd()): Promise<OfficialDownloadSummary> {
  const urls = OFFICIAL_LOTO_URLS[game];
  const rawDir = path.join(rootDir, "data", "raw", "official", game);
  await mkdir(path.join(rawDir, "draws"), { recursive: true });
  const downloadedAt = new Date().toISOString();

  const currentPage = await fetchText(urls.currentPage, "utf8");
  await writeFile(path.join(rawDir, "current-page.html"), currentPage.text, "utf8");

  const indexCsv = await fetchText(urls.indexCsv, "shift_jis");
  await writeFile(path.join(rawDir, "index.csv"), indexCsv.buffer);
  await writeFile(path.join(rawDir, "index.utf8.txt"), indexCsv.text, "utf8");

  const drawNumbers = parseOfficialIndexDrawNumbers(indexCsv.text);
  const draws: Draw[] = [];
  const sourceUrls: string[] = [urls.currentPage, urls.indexCsv];

  for (const drawNumber of drawNumbers) {
    const detailUrl = `${urls.detailPrefix}${drawNumber.toString().padStart(4, "0")}.CSV`;
    sourceUrls.push(detailUrl);
    const detail = await fetchText(detailUrl, "shift_jis");
    if (!detail.ok) {
      continue;
    }
    await writeFile(path.join(rawDir, "draws", `${drawNumber}.csv`), detail.buffer);
    await writeFile(path.join(rawDir, "draws", `${drawNumber}.utf8.txt`), detail.text, "utf8");
    draws.push(parseOfficialDrawCsv(game, detail.text, detailUrl, downloadedAt, sha256(detail.buffer)));
  }

  draws.sort((a, b) => a.drawNumber - b.drawNumber);
  await writeFile(path.join(rawDir, "official_draws.json"), `${JSON.stringify(draws, null, 2)}\n`, "utf8");
  const summary: OfficialDownloadSummary = {
    game,
    downloadedAt,
    currentPageStatus: currentPage.status,
    indexStatus: indexCsv.status,
    drawCount: draws.length,
    firstDraw: draws.at(0)?.drawNumber ?? null,
    latestDraw: draws.at(-1)?.drawNumber ?? null,
    rawDir,
    sourceUrls
  };
  await writeFile(path.join(rawDir, "official-download-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return summary;
}

export function parseOfficialIndexDrawNumbers(text: string): number[] {
  const numbers = [...text.matchAll(/第0*(\d+)回/g)].map((match) => Number(match[1]));
  return [...new Set(numbers)].filter(Number.isFinite).sort((a, b) => b - a);
}

export function parseOfficialDrawCsv(game: GameType, text: string, sourceUrl: string, downloadedAt: string, sourceHash: string): Draw {
  const normalized = normalizeFullWidth(text);
  const rows = normalized
    .trim()
    .split(/\r\n|\n|\r/)
    .map((line) => line.split(",").map((cell) => cell.trim()));
  const title = rows.find((row) => row[0]?.startsWith("第")) ?? [];
  const drawNumber = Number(title[0]?.match(/第0*(\d+)回/)?.[1]);
  const drawDate = normalizeJapaneseDate(title[2] ?? "");
  const numberRow = rows.find((row) => row[0] === "本数字");
  if (!numberRow || !Number.isFinite(drawNumber)) {
    throw new Error(`Invalid official CSV: ${sourceUrl}`);
  }
  const bonusIndex = numberRow.findIndex((cell) => cell === "ボーナス数字");
  const mainNumbers = numberRow
    .slice(1, bonusIndex)
    .map((value) => Number(value))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const bonusNumbers = numberRow
    .slice(bonusIndex + 1)
    .map((value) => Number(value))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const prizeTiers = rows
    .filter((row) => /^[1-6]等$/.test(row[0] ?? "") && ((row[1] ?? "").includes("口") || (row[1] ?? "").includes("該当なし")))
    .map(
      (row): PrizeTier => ({
        tier: Number(row[0].replace("等", "")),
        winners: parseOfficialNumber(row[1], "口"),
        prizeYen: parseOfficialNumber(row[2], "円")
      })
    );
  return {
    game,
    drawNumber,
    drawDate,
    dayOfWeek: null,
    mainNumbers,
    bonusNumbers,
    salesAmount: parseOfficialNumber(rows.find((row) => row[0] === "販売実績額")?.[1], "円"),
    carryoverAmount: parseOfficialNumber(rows.find((row) => row[0] === "キャリーオーバー")?.[1], "円"),
    prizeTiers,
    source: `official-mizuho:${sourceUrl}`,
    sourceDownloadedAt: downloadedAt,
    sourceHash
  };
}

async function fetchText(url: string, encoding: "utf8" | "shift_jis"): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 lotoloto-analysis-site/0.1",
      "Accept-Language": "ja,en;q=0.8"
    }
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    url,
    status: response.status,
    ok: response.ok,
    buffer,
    text: encoding === "shift_jis" ? iconv.decode(buffer, "Shift_JIS") : buffer.toString("utf8")
  };
}

function normalizeFullWidth(value: string): string {
  return value
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[１]/g, "1")
    .replace(/[２]/g, "2")
    .replace(/[３]/g, "3")
    .replace(/[４]/g, "4")
    .replace(/[５]/g, "5")
    .replace(/[６]/g, "6")
    .replace(/[７]/g, "7")
    .replace(/[８]/g, "8")
    .replace(/[９]/g, "9");
}

function normalizeJapaneseDate(value: string): string {
  const match = value.match(/(令和|平成)(元|\d+)年(\d+)月(\d+)日/);
  if (!match) {
    throw new Error(`Invalid Japanese date: ${value}`);
  }
  const era = match[1];
  const eraYear = match[2] === "元" ? 1 : Number(match[2]);
  const year = era === "令和" ? 2018 + eraYear : 1988 + eraYear;
  return `${year.toString().padStart(4, "0")}-${match[3].padStart(2, "0")}-${match[4].padStart(2, "0")}`;
}

function parseOfficialNumber(value: string | undefined, unit: string): number | null {
  if (!value || value.includes("該当なし")) {
    return null;
  }
  const parsed = Number(value.replace(unit, "").replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
