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

export function narrativeSignalMagnitude(weights: StrategyWeights): number {
  return NARRATIVE_SIGNAL_KEYS.reduce((sum, key) => sum + Math.abs(weights[key]), 0);
}

export function weightMagnitude(weights: StrategyWeights): number {
  return Object.values(weights).reduce((sum, value) => sum + Math.abs(value), 0);
}
