import { STRATEGY_LABELS } from "./constants";
import type { StrategyType } from "./types";

export type StrategyInfo = {
  value: StrategyType;
  label: string;
  englishName: string;
  description: string;
  suitableFor: string;
  caution: string;
};

const englishNames: Record<StrategyType, string> = {
  balance: "Balance",
  hot_trend: "Hot Trend",
  deep_gap: "Deep Gap",
  high_return: "High Return",
  pure_random: "Pure Random",
  pattern_filter: "Pattern Reference",
  smart_mix: "Smart Mix"
};

export const strategyDescriptions: Record<StrategyType, Omit<StrategyInfo, "value" | "label" | "englishName">> = {
  balance: {
    description: "過去の出現傾向、数字の散らばり、奇数偶数のバランスを見ながら作ります。",
    suitableFor: "迷ったらまずこれ。",
    caution: "当選確率を保証するものではありません。"
  },
  hot_trend: {
    description: "過去に出現回数が多い数字を少し重視します。選び方の好みを表すもので、偏りは小さく抑えています。",
    suitableFor: "過去傾向を見ながら選びたい人。",
    caution: "過去によく出た数字が次も出るとは限らず、当たりやすさは変わりません。"
  },
  deep_gap: {
    description: "最後に出てから間隔が空いている数字を少し重視します。選び方の好みを表すもので、偏りは小さく抑えています。",
    suitableFor: "数字の間隔を参考にしたい人。",
    caution: "間隔が空いている数字が、そろそろ出るとは限らず、当たりやすさは変わりません。"
  },
  high_return: {
    description:
      "誕生日や縁起の良い数字など、購入者に選ばれやすい並びを避けます。過去の口数データからも選ばれやすさを推定しています。",
    suitableFor: "当たった場合の山分けリスクを意識したい人。",
    caution: "当たりやすさを高めるものではありません。期待値は購入額を下回ります。"
  },
  pure_random: {
    description: "分析スコアの影響を抑え、ランダム性を大きく残します。",
    suitableFor: "シンプルに楽しみたい人。",
    caution: "完全な未来予測ではありません。"
  },
  pattern_filter: {
    description: "過去の並び、間隔、組み合わせの特徴を参考に候補を調整します。",
    suitableFor: "少しだけ分析感を入れたい人。",
    caution: "数字を除外するものではありません。"
  },
  smart_mix: {
    description: "複数の見方を組み合わせて、買い目ごとに違う特徴を持たせます。",
    suitableFor: "複数口買うときにバリエーションを出したい人。",
    caution: "口数が増えるほど購入金額も増えます。"
  }
};

export function listStrategies(): StrategyInfo[] {
  return (Object.keys(STRATEGY_LABELS) as StrategyType[]).map((value) => ({
    value,
    label: STRATEGY_LABELS[value],
    englishName: englishNames[value],
    ...strategyDescriptions[value]
  }));
}
