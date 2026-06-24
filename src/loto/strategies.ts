import { STRATEGY_LABELS } from "./constants";
import type { StrategyType } from "./types";

export const strategyDescriptions: Record<StrategyType, string> = {
  balance: "奇数偶数、合計値、レンジ、連番を過去分布の中央帯に寄せる参考買い目です。",
  frequent: "直近と長期の出現頻度を相対スコアとして強めるテーマです。予測保証ではありません。",
  overdue: "前回出現からの空き回数を強めるテーマです。そろそろ出ると断定しません。",
  high_payout: "31超や規則性の低い組み合わせを使い、当選時の山分けリスク低下を狙うテーマです。",
  random: "乱数を主役にし、最低限の重複回避と範囲チェックだけを行うテーマです。",
  sougaku_delete: "sougaku由来の削除数字/分割の考え方を soft penalty として検証可能に扱うテーマです。",
  mixed: "複数戦略を口ごとに混ぜ、チケット間の数字重複を抑えるテーマです。"
};

export function listStrategies(): Array<{ value: StrategyType; label: string; description: string }> {
  return (Object.keys(STRATEGY_LABELS) as StrategyType[]).map((value) => ({
    value,
    label: STRATEGY_LABELS[value],
    description: strategyDescriptions[value]
  }));
}
