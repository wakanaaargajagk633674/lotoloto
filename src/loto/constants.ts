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
  balance: "バランス",
  hot_trend: "ホットトレンド",
  deep_gap: "ディープギャップ",
  high_return: "ハイリターン",
  pure_random: "ピュアランダム",
  pattern_filter: "パターンフィルター",
  smart_mix: "スマートミックス"
};

export const BASE_DISCLAIMER =
  "この予想は過去データの傾向をもとにした参考買い目です。当選番号を保証するものではありません。";

export const HIGH_PAYOUT_DISCLAIMER =
  "ハイリターンは、当たりやすさではなく、当選時に他の購入者と数字が重なりにくくなる可能性を重視したモードです。";

export const PATTERN_FILTER_DISCLAIMER =
  "このフィルターは、過去データの並び間隔バランスを参考に候補の優先度を調整するものです。当選確率の向上を保証するものではありません。";

export function numbersForGame(game: GameType): number[] {
  return Array.from({ length: GAME_SPECS[game].maxNumber }, (_, index) => index + 1);
}
