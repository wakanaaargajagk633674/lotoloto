import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { parseLotoCsvBuffer, serializeDrawsCsv } from "../src/loto/parser";
import { validateDraw } from "../src/loto/validation";
import type { GameType } from "../src/loto/types";

async function main() {
  await mkdir("data/processed", { recursive: true });
  for (const game of ["loto6", "loto7"] as GameType[]) {
    const csvPath = path.join("data", "raw", game, "extracted", `${game}.csv`);
    const zipPath = path.join("data", "raw", game, `${game}.zip`);
    const buffer = await readFile(csvPath);
    const zipBuffer = await readFile(zipPath);
    const sourceHash = createHash("sha256").update(zipBuffer).digest("hex");
    const draws = parseLotoCsvBuffer(game, buffer, {
      source: `sougaku:${csvPath}`,
      sourceDownloadedAt: new Date().toISOString(),
      sourceHash
    });
    for (const draw of draws) {
      validateDraw(draw);
    }
    await writeFile(path.join("data", "processed", `${game}_draws.json`), `${JSON.stringify(draws, null, 2)}\n`, "utf8");
    await writeFile(path.join("data", "processed", `${game}_draws.csv`), serializeDrawsCsv(draws), "utf8");
    console.log(`${game}: parsed ${draws.length} draws, latest draw ${draws.at(-1)?.drawNumber}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
