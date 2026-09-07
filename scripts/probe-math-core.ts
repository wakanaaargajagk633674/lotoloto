import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  estimateTicketVolumes,
  expectedJackpotPayout,
  fitPopularityRegression,
  shrinkFrequencies
} from "../src/loto/mathCore";
import type { Draw, GameType } from "../src/loto/types";

async function main() {
  for (const game of ["loto6", "loto7"] as GameType[]) {
    const draws = JSON.parse(await readFile(path.join("data", "processed", `${game}_draws.json`), "utf8")) as Draw[];
    const counts = new Map<number, number>();
    for (const draw of draws) {
      for (const number of draw.mainNumbers) {
        counts.set(number, (counts.get(number) ?? 0) + 1);
      }
    }
    const shrink = shrinkFrequencies(counts, game, draws.length);
    console.log(
      `${game}: chi2=${shrink.test.statistic.toFixed(2)} dof=${shrink.test.degreesOfFreedom} p=${shrink.test.pValue.toFixed(4)} lambda=${shrink.lambda.toFixed(3)}`
    );
    const volumes = estimateTicketVolumes(game, draws);
    const latestVolume = volumes.get(draws.at(-1)!.drawNumber) ?? 0;
    console.log(`  estimated tickets sold (latest): ${Math.round(latestVolume).toLocaleString()}`);
    const regression = fitPopularityRegression(game, draws);
    if (!regression) {
      console.log("  regression: insufficient data");
      continue;
    }
    const ranked = [...regression.beta.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`  regression: obs=${regression.observations} r2=${regression.rSquared.toFixed(3)}`);
    console.log(`  most popular : ${ranked.slice(0, 6).map(([n, b]) => `${n}(${b.toFixed(3)})`).join(" ")}`);
    console.log(`  least popular: ${ranked.slice(-6).map(([n, b]) => `${n}(${b.toFixed(3)})`).join(" ")}`);
    const max = game === "loto6" ? 43 : 37;
    const count = game === "loto6" ? 6 : 7;
    const birthday = Array.from({ length: count }, (_, i) => i + 1);
    const high = Array.from({ length: count }, (_, i) => max - i * 2).sort((a, b) => a - b);
    for (const [label, ticket] of [["birthday", birthday], ["high", high]] as const) {
      const pay = expectedJackpotPayout(game, [...ticket], regression.beta, latestVolume);
      console.log(
        `  ${label} ${ticket.join(",")}: relPop=${pay.relativePopularity.toFixed(2)} coWinners=${pay.expectedCoWinners.toFixed(2)} payoutFactor=${pay.payoutFactor.toFixed(3)}`
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
