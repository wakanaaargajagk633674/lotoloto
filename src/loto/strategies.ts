import { STRATEGY_LABELS } from "./constants";
import type { StrategyType } from "./types";

export const strategyDescriptions: Record<StrategyType, string> = {
  balance: "過去傾向、数字の散らばり、奇数偶数、合計値を総合的に整える標準モードです。",
  hot_trend: "直近・長期で出現が目立つ数字を少し重視するモードです。",
  deep_gap: "しばらく出ていない数字を参考に、数字の間隔に注目するモードです。",
  high_return: "人気が集中しやすい数字を避け、当選時の分配リスクを意識するモードです。",
  pure_random: "統計スコアの影響を抑え、ランダム性を重視するモードです。",
  pattern_filter: "過去の並び間隔・組み合わせ傾向を参考に候補優先度を調整するモードです。",
  smart_mix: "複数の戦略を組み合わせ、買い目ごとに違う狙いを持たせるモードです。"
};

export function listStrategies(): Array<{ value: StrategyType; label: string; description: string }> {
  return (Object.keys(STRATEGY_LABELS) as StrategyType[]).map((value) => ({
    value,
    label: STRATEGY_LABELS[value],
    description: strategyDescriptions[value]
  }));
}
