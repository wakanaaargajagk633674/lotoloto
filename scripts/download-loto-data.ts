import { downloadLotoZip } from "../src/loto/downloader";
import type { GameType } from "../src/loto/types";

async function main() {
  for (const game of ["loto6", "loto7"] as GameType[]) {
    const result = await downloadLotoZip(game);
    console.log(`${game}: ${result.sizeBytes} bytes, sha256=${result.sha256}, entries=${result.entries.join(" ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
