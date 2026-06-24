import type { StrategyType, StrategyWeights } from "@/loto/types";

export const strategyWeights: Record<StrategyType, StrategyWeights> = {
  balance: {
    recent: 0.15,
    long: 0.15,
    gap: 0.1,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.1,
    deletion: 0.1,
    sougaku: 0.15,
    combo_balance: 0.35,
    random: 0.1
  },
  frequent: {
    recent: 0.4,
    long: 0.3,
    gap: 0.05,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.05,
    deletion: 0.05,
    sougaku: 0.1,
    combo_balance: 0.15,
    random: 0.05
  },
  overdue: {
    recent: 0.05,
    long: 0.1,
    gap: 0.45,
    prev: 0.01,
    bonus: 0.01,
    anti_pop: 0.05,
    deletion: 0.05,
    sougaku: 0.1,
    combo_balance: 0.2,
    random: 0.1
  },
  high_payout: {
    recent: 0.05,
    long: 0.05,
    gap: 0.1,
    prev: 0,
    bonus: 0,
    anti_pop: 0.4,
    deletion: 0.05,
    sougaku: 0.1,
    combo_balance: 0.25,
    random: 0.15
  },
  random: {
    recent: 0.05,
    long: 0.05,
    gap: 0.05,
    prev: 0,
    bonus: 0,
    anti_pop: 0.05,
    deletion: 0,
    sougaku: 0.05,
    combo_balance: 0.1,
    random: 0.65
  },
  sougaku_delete: {
    recent: 0.1,
    long: 0.1,
    gap: 0.1,
    prev: 0.02,
    bonus: 0.02,
    anti_pop: 0.1,
    deletion: 0.35,
    sougaku: 0.35,
    combo_balance: 0.2,
    random: 0.05
  },
  mixed: {
    recent: 0.16,
    long: 0.14,
    gap: 0.16,
    prev: 0.01,
    bonus: 0.01,
    anti_pop: 0.17,
    deletion: 0.12,
    sougaku: 0.14,
    combo_balance: 0.25,
    random: 0.18
  }
};

export function weightMagnitude(weights: StrategyWeights): number {
  return Object.values(weights).reduce((sum, value) => sum + Math.abs(value), 0);
}
