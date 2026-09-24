import type { StrategyType, StrategyWeights } from "@/loto/types";

/**
 * 重みの考え方。
 *
 * 抽せんはランダムなので、どの数字を選んでも当せん確率は変わらない。
 * したがって recent / long / gap / pattern_filter のような「出方の傾向」は、
 * 当たりやすさを高めるものではなく、買い目の作り方の好みを表すシグナルとして扱う。
 * これらの重みは合計が大きくなりすぎないように抑え、残りは neutral_blend で
 * 一様抽出へ引き戻すことで、当せん確率が偏らないようにしている。
 *
 * ev_share は当せんした場合の分配人数を抑えることを狙う重みで、
 * 当たりやすさではなく受取額の期待に関わる唯一の要素として扱う。
 * neutral_blend は 1 に近いほど中立で、根拠の弱い偏りを打ち消す。
 */
export const strategyWeights: Record<StrategyType, StrategyWeights> = {
  balance: {
    recent: 0.06,
    long: 0.06,
    gap: 0.05,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.06,
    candidate_tuning: 0.05,
    pattern_filter: 0.06,
    previous_overlap: 0.06,
    combo_balance: 0.2,
    random: 0.12,
    ev_share: 0.28,
    neutral_blend: 0.5
  },
  hot_trend: {
    recent: 0.22,
    long: 0.16,
    gap: 0.03,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.05,
    candidate_tuning: 0.03,
    pattern_filter: 0.05,
    previous_overlap: 0.04,
    combo_balance: 0.12,
    random: 0.08,
    ev_share: 0.2,
    neutral_blend: 0.4
  },
  deep_gap: {
    recent: 0.03,
    long: 0.05,
    gap: 0.24,
    prev: 0.01,
    bonus: 0.01,
    anti_pop: 0.05,
    candidate_tuning: 0.03,
    pattern_filter: 0.05,
    previous_overlap: 0.04,
    combo_balance: 0.12,
    random: 0.1,
    ev_share: 0.2,
    neutral_blend: 0.4
  },
  high_return: {
    recent: 0.02,
    long: 0.02,
    gap: 0.04,
    prev: 0,
    bonus: 0,
    anti_pop: 0.18,
    candidate_tuning: 0.03,
    pattern_filter: 0.04,
    previous_overlap: 0.03,
    combo_balance: 0.14,
    random: 0.12,
    ev_share: 0.6,
    neutral_blend: 0.45
  },
  pure_random: {
    recent: 0.01,
    long: 0.01,
    gap: 0.01,
    prev: 0,
    bonus: 0,
    anti_pop: 0.02,
    candidate_tuning: 0,
    pattern_filter: 0.01,
    previous_overlap: 0.01,
    combo_balance: 0.05,
    random: 0.6,
    ev_share: 0.06,
    neutral_blend: 0.92
  },
  pattern_filter: {
    recent: 0.05,
    long: 0.05,
    gap: 0.05,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.06,
    candidate_tuning: 0.18,
    pattern_filter: 0.18,
    previous_overlap: 0.05,
    combo_balance: 0.16,
    random: 0.08,
    ev_share: 0.22,
    neutral_blend: 0.42
  },
  smart_mix: {
    recent: 0.06,
    long: 0.05,
    gap: 0.06,
    prev: 0.01,
    bonus: 0.01,
    anti_pop: 0.08,
    candidate_tuning: 0.05,
    pattern_filter: 0.05,
    previous_overlap: 0.04,
    combo_balance: 0.16,
    random: 0.16,
    ev_share: 0.32,
    neutral_blend: 0.6
  }
};

/** 根拠の弱い「出方の傾向」シグナル。合計影響度に上限を設けて監視する。 */
export const NARRATIVE_SIGNAL_KEYS = [
  "recent",
  "long",
  "gap",
  "prev",
  "bonus",
  "candidate_tuning",
  "pattern_filter"
] as const;

export const NARRATIVE_SIGNAL_BUDGET = 0.62;

/**
 * 人気度モデル (当せん時の山分け人数の見積もり) の設定。
 * 値は 2026-09-25 の25人会議で、ウォークフォワードの標本外検証をもとに決めた
 * (docs/backtest/popularity-calibration-report.md)。
 *
 * - trainTiers : 数字ごとの人気度 γ を学ぶ等級。ロト6・ロト7とも 4等+5等 が1等口数の予測に最も効いた。
 * - ridge      : γ の Ridge 罰則。16 が1等口数の標本外対数尤度で最良帯。
 * - slopePrior : 等級換算の理論係数が正しければ傾き s = 1。N(1, 0.3²) で緩く縛る。
 * - patternPriorSd : 「全部31以下」などの並びのクセ δ を N(0, 0.1²) で縮小して推定する。
 */
export const popularityCalibrationSettings = {
  loto6: {
    trainTiers: [4, 5],
    ridge: 16,
    warmup: 300,
    refitEvery: 10,
    slopePriorMean: 1,
    slopePriorSd: 0.3,
    patternPriorSd: 0.1,
    minCalibrationDraws: 100
  },
  loto7: {
    trainTiers: [4, 5],
    ridge: 16,
    warmup: 150,
    refitEvery: 10,
    slopePriorMean: 1,
    slopePriorSd: 0.3,
    patternPriorSd: 0.1,
    minCalibrationDraws: 100
  }
} as const satisfies Record<"loto6" | "loto7", {
  trainTiers: readonly number[];
  ridge: number;
  warmup: number;
  refitEvery: number;
  slopePriorMean: number;
  slopePriorSd: number;
  patternPriorSd: number;
  minCalibrationDraws: number;
}>;

/** 賞金の基準額を取る直近回数。全等級の期待払戻の重み付けに使う。 */
export const PRIZE_BASELINE_WINDOW = 100;

export function narrativeSignalMagnitude(weights: StrategyWeights): number {
  return NARRATIVE_SIGNAL_KEYS.reduce((sum, key) => sum + Math.abs(weights[key]), 0);
}

export function weightMagnitude(weights: StrategyWeights): number {
  return Object.values(weights).reduce((sum, value) => sum + Math.abs(value), 0);
}
