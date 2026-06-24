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
  frequent: "頻出数字重視",
  overdue: "未出現数字重視",
  high_payout: "高配当狙い",
  random: "ランダム重視",
  sougaku_delete: "削除数字参考",
  mixed: "複合ミックス"
};

export const BASE_DISCLAIMER =
  "この予想は過去データの傾向をもとにした参考買い目です。当選番号を保証するものではありません。";

export const HIGH_PAYOUT_DISCLAIMER =
  "高配当狙いは、当たりやすさではなく、当選時に他の購入者と数字が重なりにくくなる可能性を重視したモードです。";

export const SOUGAKU_DELETE_DISCLAIMER =
  "削除数字は過去傾向から候補を絞る考え方ですが、当選確率の向上を保証するものではありません。本アプリでは検証可能なスコアとして扱います。";

export function numbersForGame(game: GameType): number[] {
  return Array.from({ length: GAME_SPECS[game].maxNumber }, (_, index) => index + 1);
}
