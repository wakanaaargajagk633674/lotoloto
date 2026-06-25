import type { GameType, StrategyType } from "./types";

export const GAME_SPECS: Record<
  GameType,
  {
    label: string;
    maxNumber: number;
    mainCount: number;
    bonusCount: number;
    ticketPriceYen: number;
    firstPrizeOdds: number;
    sourceZipUrl: string;
    sougakuTopUrl: string;
  }
> = {
  loto6: {
    label: "ロト6",
    maxNumber: 43,
    mainCount: 6,
    bonusCount: 1,
    ticketPriceYen: 200,
    firstPrizeOdds: 6096454,
    sourceZipUrl: "http://sougaku.com/loto6/download/loto6.zip",
    sougakuTopUrl: "http://sougaku.com/loto6/"
  },
  loto7: {
    label: "ロト7",
    maxNumber: 37,
    mainCount: 7,
    bonusCount: 2,
    ticketPriceYen: 300,
    firstPrizeOdds: 10295472,
    sourceZipUrl: "http://sougaku.com/loto7/download/loto7.zip",
    sougakuTopUrl: "http://sougaku.com/loto7/"
  }
};

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  balance: "バランス重視",
  hot_trend: "よく出ている数字参考",
  deep_gap: "しばらく出ていない数字参考",
  high_return: "分配リスクを意識",
  pure_random: "ランダム中心",
  pattern_filter: "パターン参考",
  smart_mix: "おまかせミックス"
};

export const BASE_DISCLAIMER =
  "このサービスは、過去データをもとに参考買い目を作成するものです。当選番号を予測保証するものではありません。無理のない範囲でお楽しみください。";

export const HIGH_PAYOUT_DISCLAIMER =
  "分配リスクを意識するモードは、当たりやすさではなく、当たった場合に他の購入者と数字が重なりにくくなる可能性を参考にするものです。";

export const PATTERN_FILTER_DISCLAIMER =
  "パターン参考は、過去データの並びや間隔を参考に候補の優先度を調整するものです。数字を除外したり、当選確率の向上を保証したりするものではありません。";

export function numbersForGame(game: GameType): number[] {
  return Array.from({ length: GAME_SPECS[game].maxNumber }, (_, index) => index + 1);
}
