import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GAME_SPECS } from "./constants";
import type { GameType } from "./types";

export type DownloadResult = {
  game: GameType;
  url: string;
  zipPath: string;
  extractedDir: string;
  downloadedAt: string;
  sha256: string;
  sizeBytes: number;
  entries: string[];
};

export async function downloadLotoZip(game: GameType, rootDir = process.cwd()): Promise<DownloadResult> {
  const spec = GAME_SPECS[game];
  const rawDir = path.join(rootDir, "data", "raw", game);
  const extractedDir = path.join(rawDir, "extracted");
  await mkdir(extractedDir, { recursive: true });

  const response = await fetch(spec.sourceZipUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 lotoloto-data-pipeline/0.1"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${spec.sourceZipUrl}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const zipPath = path.join(rawDir, `${game}.zip`);
  await writeFile(zipPath, buffer);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const zip = new AdmZip(buffer);
  zip.extractAllTo(extractedDir, true);
  const result: DownloadResult = {
    game,
    url: spec.sourceZipUrl,
    zipPath,
    extractedDir,
    downloadedAt: new Date().toISOString(),
    sha256,
    sizeBytes: buffer.byteLength,
    entries: zip.getEntries().map((entry) => entry.entryName)
  };
  await writeFile(path.join(rawDir, "download-metadata.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return result;
}

export async function downloadLotoZipWithFallback(
  game: GameType,
  rootDir = process.cwd(),
  downloader: (game: GameType, rootDir?: string) => Promise<DownloadResult> = downloadLotoZip
): Promise<
  | { ok: true; result: DownloadResult; fallbackReasons: string[] }
  | { ok: false; result: null; fallbackReasons: string[]; sourceUrl: string }
> {
  try {
    return { ok: true, result: await downloader(game, rootDir), fallbackReasons: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      result: null,
      sourceUrl: GAME_SPECS[game].sourceZipUrl,
      fallbackReasons: [
        message,
        "Keep the sougaku URL in the data function and use existing data/raw or data/processed files if available.",
        "Record the failure in docs/research/sougaku-access-log.md before using a non-sougaku substitute."
      ]
    };
  }
}

export async function readDownloadMetadata(game: GameType, rootDir = process.cwd()): Promise<Partial<DownloadResult> | null> {
  try {
    const raw = await readFile(path.join(rootDir, "data", "raw", game, "download-metadata.json"), "utf8");
    return JSON.parse(raw) as DownloadResult;
  } catch {
    return null;
  }
}
