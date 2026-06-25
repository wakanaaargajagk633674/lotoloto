import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { compareDrawSources, serializeSourceComparisonCsv, summarizeComparison } from "../src/loto/sourceComparison";
import type { Draw, GameType } from "../src/loto/types";

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function main() {
  await mkdir(path.join("data", "quality"), { recursive: true });
  const reportLines = [
    "# Source Quality Report",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "Official Mizuho CSV data is used for the latest available range. Sougaku ZIP data remains the full-history source for normalized processed data.",
    ""
  ];

  for (const game of ["loto6", "loto7"] as GameType[]) {
    const official = await readJson<Draw[]>(path.join("data", "raw", "official", game, "official_draws.json"), []);
    const history = await readJson<Draw[]>(path.join("data", "processed", `${game}_draws.json`), []);
    const rows = compareDrawSources(game, official, history);
    const summary = summarizeComparison(rows);
    await writeFile(path.join("data", "quality", `${game}_source_comparison.csv`), serializeSourceComparisonCsv(rows), "utf8");
    reportLines.push(
      `## ${game}`,
      "",
      `- Official rows: ${summary.officialRows}`,
      `- Official range: ${summary.firstOfficialDraw ?? "-"} to ${summary.latestOfficialDraw ?? "-"}`,
      `- Overlap rows: ${summary.overlapRows}`,
      `- OK rows: ${summary.okRows}`,
      `- Different rows: ${summary.differentRows}`,
      `- Missing official rows: ${summary.missingOfficialRows}`,
      `- Missing history rows: ${summary.missingHistoryRows}`,
      "",
      "Interpretation: differences must be reviewed before relying on fields such as sales amount, carryover, winners, and prize amount. Main numbers and dates are the first priority for site display.",
      ""
    );
    console.log(`${game}: official=${summary.officialRows}, overlap=${summary.overlapRows}, diff=${summary.differentRows}`);
  }

  await writeFile(path.join("data", "quality", "source-quality-report.md"), `${reportLines.join("\n")}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
