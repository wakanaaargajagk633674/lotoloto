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
      "| 戦略 | 試行 | 平均一致数 | 3個以上一致率 | 的中数 | 平均払戻/口 | 最大DD | 推定人気度 | 一様との差 | 期待受取係数 | 3個組被覆 |",
      "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|"
    );
    for (const [strategy, row] of Object.entries(summary.strategies)) {
      reportSections.push(
        `| ${strategy} | ${row.trials} | ${row.averageMainMatches.toFixed(3)} | ${(row.match3PlusRate * 100).toFixed(2)}% | ${row.prizeHitCount} | ${row.averagePayoutPerTicketYen.toFixed(1)} | ${row.maxDrawdownYen.toFixed(0)} | ${row.averageCombinationPopularityIndex.toFixed(3)} | ${row.selectionEntropyGap.toFixed(3)} | ${row.averagePayoutFactor.toFixed(3)} | ${row.tripleCoverageRatio.toFixed(3)} |`
      );
    }
    reportSections.push(
      "",
      "- ランダムとの差は小さく、期待値の優位差は偶然の範囲に見える可能性が高い。",
      "- 有効に見える結果があっても、期間分割・乱数シード変更・感度分析で崩れるかを確認する。",
      "- UIでは「当たりやすい」ではなく、戦略テーマ別の参考買い目として表現する。",
      "- 推定人気度は当せんした場合の分配人数の目安で、当せん確率とは無関係。低いほど重なりにくい。",
      "- 一様との差は数字の選び方が一様分布からどれだけ離れているかで、0 に近いほど偏りが小さい。",
      "- 払戻の増減は 1 等から 3 等の稀な的中に左右されるため、戦略間の差は偶然の範囲として扱う。",
      "- 期待受取係数は予想時点の口数データから求めた 1等の E[1/(1+同時当せん者数)] (独占 = 1)。当せん確率とは無関係で、高いほど山分けが少ない見込み。",
      "- 3個組被覆は全回の買い目を並べたときの 3 個組の非重複率。"
    );
  }

  await writeFile(path.join("docs", "backtest", "backtest-report.md"), `${reportSections.join("\n")}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
