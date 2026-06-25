import type { StrategyType, StrategyWeights } from "@/loto/types";

export const strategyWeights: Record<StrategyType, StrategyWeights> = {
  balance: {
    recent: 0.15,
    long: 0.15,
    gap: 0.1,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.1,
    candidate_tuning: 0.1,
    pattern_filter: 0.15,
    combo_balance: 0.35,
    random: 0.1
  },
  hot_trend: {
    recent: 0.4,
    long: 0.3,
    gap: 0.05,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.05,
    candidate_tuning: 0.05,
    pattern_filter: 0.1,
    combo_balance: 0.15,
    random: 0.05
  },
  deep_gap: {
    recent: 0.05,
    long: 0.1,
    gap: 0.45,
    prev: 0.01,
    bonus: 0.01,
    anti_pop: 0.05,
    candidate_tuning: 0.05,
    pattern_filter: 0.1,
    combo_balance: 0.2,
    random: 0.1
  },
  high_return: {
    recent: 0.05,
    long: 0.05,
    gap: 0.1,
    prev: 0,
    bonus: 0,
    anti_pop: 0.4,
    candidate_tuning: 0.05,
    pattern_filter: 0.1,
    combo_balance: 0.25,
    random: 0.15
  },
  pure_random: {
    recent: 0.05,
    long: 0.05,
    gap: 0.05,
    prev: 0,
    bonus: 0,
    anti_pop: 0.05,
    candidate_tuning: 0,
    pattern_filter: 0.05,
    combo_balance: 0.1,
    random: 0.65
  },
  pattern_filter: {
    recent: 0.1,
    long: 0.1,
    gap: 0.1,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.1,
    candidate_tuning: 0.35,
    pattern_filter: 0.35,
    combo_balance: 0.2,
    random: 0.05
  },
  smart_mix: {
    recent: 0.16,
    long: 0.14,
    gap: 0.16,
    prev: 0.01,
    bonus: 0.01,
    anti_pop: 0.17,
    candidate_tuning: 0.12,
    pattern_filter: 0.14,
    combo_balance: 0.25,
    random: 0.18
  }
};

export function weightMagnitude(weights: StrategyWeights): number {
  return Object.values(weights).reduce((sum, value) => sum + Math.abs(value), 0);
}
