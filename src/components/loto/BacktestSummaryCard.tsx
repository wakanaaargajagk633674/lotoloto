import { STRATEGY_LABELS } from "@/loto/constants";
import type { BacktestSummary, GameType, StrategyType } from "@/loto/types";

export default function BacktestSummaryCard({ summary }: { game: GameType; summary?: BacktestSummary }) {
  if (!summary) {
    return (
      <article className="status-card">
        <span>バックテスト概要</span>
        <strong>未生成</strong>
        <small>ウォークフォワード検証結果を生成すると表示されます。</small>
      </article>
    );
  }
  const rows = Object.entries(summary.strategies) as Array<[StrategyType, BacktestSummary["strategies"][StrategyType]]>;
  const bestByMatch = rows.sort((a, b) => b[1].averageMainMatches - a[1].averageMainMatches)[0];

  return (
    <article className="status-card">
      <span>バックテスト概要</span>
      <strong>{STRATEGY_LABELS[bestByMatch[0]]}</strong>
      <small>
        平均一致数 {bestByMatch[1].averageMainMatches.toFixed(3)}。短期差は偶然の範囲を含むため、優劣の断定には使いません。
      </small>
    </article>
  );
}
