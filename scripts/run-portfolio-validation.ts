import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { classifyPrize } from "../src/loto/backtest";
import { GAME_SPECS } from "../src/loto/constants";
import { generateTickets } from "../src/loto/generator";
import type { CandidateTuningMode, Draw, GameType, StrategyType } from "../src/loto/types";

type PortfolioProfile = {
  id: string;
  strategy: StrategyType;
  candidateTuningMode: CandidateTuningMode;
  randomStrength: number;
  highReturnStrength: number;
};

type PortfolioSummaryRow = {
  game: GameType;
  profile: string;
  drawTrials: number;
  ticketTrials: number;
  spendYen: number;
  totalPayoutYen: number;
  roi: number;
  prizeHitCount: number;
  ticketPrizeRate: number;
  atLeastOnePrizeDrawRate: number;
  averageMainMatches: number;
  maxMainMatches: number;
  averageUniqueCoverage: number;
};

type PortfolioDetailRow = {
  game: GameType;
  profile: string;
  targetDraw: number;
  ticketCount: number;
  prizeHitCount: number;
  bestMainMatches: number;
  payoutYen: number;
  uniqueCoverage: number;
};

const profiles: PortfolioProfile[] = [
  { id: "smart_mix_recommended", strategy: "smart_mix", candidateTuningMode: "light", randomStrength: 55, highReturnStrength: 60 },
  { id: "pure_random_control", strategy: "pure_random", candidateTuningMode: "off", randomStrength: 70, highReturnStrength: 50 },
  { id: "high_return_control", strategy: "high_return", candidateTuningMode: "light", randomStrength: 55, highReturnStrength: 70 }
];

async function readDraws(game: GameType): Promise<Draw[]> {
  const raw = await readFile(path.join("data", "processed", `${game}_draws.json`), "utf8");
  return JSON.parse(raw) as Draw[];
}

async function main() {
  const outputDir = path.join("data", "backtest", "portfolio-validation");
  await mkdir(outputDir, { recursive: true });
  await mkdir(path.join("docs", "backtest"), { recursive: true });

  const summaries: PortfolioSummaryRow[] = [];
  const details: PortfolioDetailRow[] = [];

  for (const game of ["loto6", "loto7"] as GameType[]) {
    const draws = await readDraws(game);
    const ticketCount = game === "loto6" ? 20 : 10;
    const minTrainingDraws = game === "loto6" ? 300 : 120;
    const startIndex = Math.max(minTrainingDraws, draws.length - 120);

    for (const [profileIndex, profile] of profiles.entries()) {
      const ticketRows: { mainMatches: number; prizeTier: number | null; payoutYen: number }[] = [];
      const drawRows: PortfolioDetailRow[] = [];

      for (let targetIndex = startIndex; targetIndex < draws.length; targetIndex += 1) {
        const history = draws.slice(0, targetIndex);
        const actual = draws[targetIndex];
        const tickets = generateTickets(history, {
          game,
          strategy: profile.strategy,
          ticketCount,
          seed: 91000 + profileIndex * 1000 + targetIndex * 17,
          candidateTuningMode: profile.candidateTuningMode,
          randomStrength: profile.randomStrength,
          highReturnStrength: profile.highReturnStrength
        });
        const ticketResults = tickets.map((ticket) => {
          const mainMatches = ticket.numbers.filter((number) => actual.mainNumbers.includes(number)).length;
          const bonusMatches = ticket.numbers.filter((number) => actual.bonusNumbers.includes(number)).length;
          const prizeTier = classifyPrize(game, mainMatches, bonusMatches);
          return {
            mainMatches,
            prizeTier,
            payoutYen: prizeTier ? (actual.prizeTiers.find((tier) => tier.tier === prizeTier)?.prizeYen ?? 0) : 0
          };
        });
        ticketRows.push(...ticketResults);
        const detail = {
          game,
          profile: profile.id,
          targetDraw: actual.drawNumber,
          ticketCount,
          prizeHitCount: ticketResults.filter((row) => row.prizeTier !== null).length,
          bestMainMatches: Math.max(...ticketResults.map((row) => row.mainMatches)),
          payoutYen: ticketResults.reduce((sum, row) => sum + row.payoutYen, 0),
          uniqueCoverage: new Set(tickets.flatMap((ticket) => ticket.numbers)).size
        };
        drawRows.push(detail);
        details.push(detail);
      }

      const drawTrials = drawRows.length;
      const ticketTrials = ticketRows.length;
      const spendYen = ticketTrials * GAME_SPECS[game].ticketPriceYen;
      const totalPayoutYen = ticketRows.reduce((sum, row) => sum + row.payoutYen, 0);
      summaries.push({
        game,
        profile: profile.id,
        drawTrials,
        ticketTrials,
        spendYen,
        totalPayoutYen,
        roi: spendYen ? totalPayoutYen / spendYen : 0,
        prizeHitCount: ticketRows.filter((row) => row.prizeTier !== null).length,
        ticketPrizeRate: ticketTrials ? ticketRows.filter((row) => row.prizeTier !== null).length / ticketTrials : 0,
        atLeastOnePrizeDrawRate: drawTrials ? drawRows.filter((row) => row.prizeHitCount > 0).length / drawTrials : 0,
        averageMainMatches: average(ticketRows.map((row) => row.mainMatches)),
        maxMainMatches: Math.max(...ticketRows.map((row) => row.mainMatches)),
        averageUniqueCoverage: average(drawRows.map((row) => row.uniqueCoverage))
      });
    }
  }

  await writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summaries, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "detail.csv"), serializeDetails(details), "utf8");
  await writeFile(path.join("docs", "backtest", "portfolio-validation-report.md"), buildReport(summaries), "utf8");
  console.log(`portfolio validation: ${summaries.length} summary rows, ${details.length} draw rows`);
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function serializeDetails(rows: PortfolioDetailRow[]): string {
  const headers = ["game", "profile", "targetDraw", "ticketCount", "prizeHitCount", "bestMainMatches", "payoutYen", "uniqueCoverage"];
  return `${headers.join(",")}\n${rows
    .map((row) =>
      [
        row.game,
        row.profile,
        row.targetDraw,
        row.ticketCount,
        row.prizeHitCount,
        row.bestMainMatches,
        row.payoutYen,
        row.uniqueCoverage
      ].join(",")
    )
    .join("\n")}\n`;
}

function buildReport(rows: PortfolioSummaryRow[]): string {
  const lines = [
    "# Portfolio Validation Report",
    "",
    "直近120回を対象に、各回の直前までの履歴だけを使って Loto6 は20点、Loto7 は10点を生成した短期ウォークフォワード検証。",
    "ロトはランダム抽せんなので、この結果は将来の当せん確率向上を保証しない。買い目の重複抑制、カバレッジ、過去検証上の挙動を見るための参考値。",
    "",
    "| game | profile | draws | tickets | prize hits | ticket hit rate | at least one hit/draw | avg main matches | max main matches | payout/spend | avg unique coverage |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|"
  ];
  for (const row of rows) {
    lines.push(
      `| ${row.game} | ${row.profile} | ${row.drawTrials} | ${row.ticketTrials} | ${row.prizeHitCount} | ${(row.ticketPrizeRate * 100).toFixed(2)}% | ${(row.atLeastOnePrizeDrawRate * 100).toFixed(2)}% | ${row.averageMainMatches.toFixed(3)} | ${row.maxMainMatches} | ${(row.roi * 100).toFixed(1)}% | ${row.averageUniqueCoverage.toFixed(1)} |`
    );
  }
  lines.push(
    "",
    "採用判断:",
    "",
    "- Loto6: 直近120回の20点運用では high_return_control が低等級ヒット件数で最良。smart_mix は5一致の一回で払戻比率が上振れたが、ヒット率の優位とは扱わない。",
    "- Loto7: 直近120回の10点運用では pure_random_control が最良。今回はLoto7に予測寄りの追加補正を採用せず、ランダム分散を重視する。",
    "- いずれも当選保証ではない。購入額を増やす判断材料にはしない。"
  );
  return `${lines.join("\n")}\n`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
