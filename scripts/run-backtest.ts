import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runWalkForwardBacktest, serializeBacktestDetailCsv } from "../src/loto/backtest";
import type { Draw, GameType } from "../src/loto/types";

async function readDraws(game: GameType): Promise<Draw[]> {
  const raw = await readFile(path.join("data", "processed", `${game}_draws.json`), "utf8");
  return JSON.parse(raw) as Draw[];
}

async function main() {
  await mkdir(path.join("data", "backtest", "results"), { recursive: true });
  const reportSections: string[] = [
    "# Backtest Report",
    "",
    "ウォークフォワード方式で、各回の予想時点までの履歴だけを使って次回を評価した。",
    "結果は参考実装の初期値であり、当選確率の向上を示すものではない。"
  ];

  for (const game of ["loto6", "loto7"] as GameType[]) {
    const draws = await readDraws(game);
    const { summary, detail } = runWalkForwardBacktest(draws, game);
    await writeFile(
      path.join("data", "backtest", "results", `${game}_backtest_summary.json`),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      path.join("data", "backtest", "results", `${game}_backtest_detail.csv`),
      serializeBacktestDetailCsv(detail),
      "utf8"
    );

    reportSections.push(
      "",
      `## ${game}`,
      "",
      "| 戦略 | 試行 | 平均一致数 | 3個以上一致率 | 的中数 | 平均払戻/口 | 最大DD |",
      "|---|---:|---:|---:|---:|---:|---:|"
    );
    for (const [strategy, row] of Object.entries(summary.strategies)) {
      reportSections.push(
        `| ${strategy} | ${row.trials} | ${row.averageMainMatches.toFixed(3)} | ${(row.match3PlusRate * 100).toFixed(2)}% | ${row.prizeHitCount} | ${row.averagePayoutPerTicketYen.toFixed(1)} | ${row.maxDrawdownYen.toFixed(0)} |`
      );
    }
    reportSections.push(
      "",
      "- ランダムとの差は小さく、期待値の優位差は偶然の範囲に見える可能性が高い。",
      "- 有効に見える結果があっても、期間分割・乱数シード変更・感度分析で崩れるかを確認する。",
      "- UIでは「当たりやすい」ではなく、戦略テーマ別の参考買い目として表現する。"
    );
  }

  await writeFile(path.join("docs", "backtest", "backtest-report.md"), `${reportSections.join("\n")}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
