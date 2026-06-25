import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { downloadOfficialLotoData } from "../src/loto/officialDownloader";
import type { GameType } from "../src/loto/types";

async function mirrorSougakuRaw(game: GameType) {
  const targetDir = path.join("data", "raw", "sougaku", game);
  await mkdir(path.join(targetDir, "extracted"), { recursive: true });
  for (const [from, to] of [
    [path.join("data", "raw", game, `${game}.zip`), path.join(targetDir, `${game}.zip`)],
    [path.join("data", "raw", game, "extracted", `${game}.csv`), path.join(targetDir, "extracted", `${game}.csv`)]
  ]) {
    try {
      await copyFile(from, to);
    } catch {
      // Existing raw sougaku files are optional in fresh clones.
    }
  }
}

async function main() {
  const summaries = [];
  for (const game of ["loto6", "loto7"] as GameType[]) {
    await mirrorSougakuRaw(game);
    const summary = await downloadOfficialLotoData(game);
    summaries.push(summary);
    console.log(`${game}: official CSV draws=${summary.drawCount}, range=${summary.firstDraw}-${summary.latestDraw}`);
  }
  await mkdir(path.join("data", "raw", "official"), { recursive: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
