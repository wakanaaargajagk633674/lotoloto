import { strategyWeights } from "@/config/strategyWeights";
import { GAME_SPECS } from "./constants";
import { zScoreMap } from "./features";
import type { CombinationScores, Draw, GameType, NumberFeature, NumberScore, StrategyType } from "./types";

export function scoreNumbers(strategy: StrategyType, features: NumberFeature[]): NumberScore[] {
  const weights = strategyWeights[strategy];
  const domain = features.map((feature) => feature.number);
  const recentZ = zScoreMap(new Map(features.map((feature) => [feature.number, feature.recent100Frequency])), domain);
  const longZ = zScoreMap(new Map(features.map((feature) => [feature.number, feature.longTermFrequency])), domain);
  const gapZ = zScoreMap(new Map(features.map((feature) => [feature.number, feature.lastSeenGap])), domain);

  return features.map((feature) => {
    const parts = {
      recent: weights.recent * (recentZ.get(feature.number) ?? 0),
      long: weights.long * (longZ.get(feature.number) ?? 0),
      gap: weights.gap * (gapZ.get(feature.number) ?? 0),
      prev: weights.prev * (feature.appearedInPreviousDraw ? -1 : 0.15),
      bonus: weights.bonus * (feature.appearedInPreviousBonus ? 0.05 : 0),
      anti_pop: weights.anti_pop * feature.antiPopularityScore,
      deletion: weights.deletion * -feature.deletionCandidateScore,
      sougaku: weights.sougaku * (feature.sougakuPartitionScore - feature.sougakuDeletionScore),
      random: weights.random * feature.randomNoise
    };
    const total = Object.values(parts).reduce((sum, value) => sum + value, 0);
    return {
      number: feature.number,
      total,
      parts,
      feature: { ...feature, scoreParts: parts }
    };
  });
}

export function scoreCombination(
  game: GameType,
  strategy: StrategyType,
  ticket: number[],
  numberScores: NumberScore[],
  history: Draw[]
): CombinationScores {
  const spec = GAME_SPECS[game];
  const previousDraw = history.at(-1);
  const scoreByNumber = new Map(numberScores.map((score) => [score.number, score]));
  const sorted = [...ticket].sort((a, b) => a - b);
  const oddCount = sorted.filter((number) => number % 2 === 1).length;
  const evenCount = sorted.length - oddCount;
  const lowCut = Math.ceil(spec.maxNumber / 3);
  const midCut = Math.ceil((spec.maxNumber * 2) / 3);
  const lowCount = sorted.filter((number) => number <= lowCut).length;
  const midCount = sorted.filter((number) => number > lowCut && number <= midCut).length;
  const highCount = sorted.length - lowCount - midCount;
  const consecutivePairCount = sorted.slice(1).filter((number, index) => number === sorted[index] + 1).length;
  const maxConsecutiveRun = computeMaxConsecutiveRun(sorted);
  const lastDigitCounts = groupCounts(sorted.map((number) => number % 10));
  const tensGroupDistribution = Object.fromEntries(
    [...groupCounts(sorted.map((number) => `${Math.floor(number / 10) * 10}s`)).entries()].sort()
  );
  const averageNumberScore =
    sorted.reduce((sum, number) => sum + (scoreByNumber.get(number)?.total ?? 0), 0) / sorted.length;
  const deletionRiskScore =
    sorted.reduce((sum, number) => sum + (scoreByNumber.get(number)?.feature.deletionCandidateScore ?? 0), 0) /
    sorted.length;
  const popularityAvoidanceScore =
    sorted.reduce((sum, number) => sum + (scoreByNumber.get(number)?.feature.antiPopularityScore ?? 0), 0) /
    sorted.length;
  const balanceScore = computeBalanceScore(game, sorted, oddCount, lowCount, midCount, highCount, consecutivePairCount);
  const diversityScore = 1 - Math.max(...lastDigitCounts.values()) / sorted.length;

  return {
    sum: sorted.reduce((sum, number) => sum + number, 0),
    oddCount,
    evenCount,
    lowCount,
    midCount,
    highCount,
    over31Count: sorted.filter((number) => number > 31).length,
    consecutivePairCount,
    maxConsecutiveRun,
    sameLastDigitCount: Math.max(...lastDigitCounts.values()),
    tensGroupDistribution,
    previousDrawOverlap: previousDraw ? sorted.filter((number) => previousDraw.mainNumbers.includes(number)).length : 0,
    previousBonusOverlap: previousDraw ? sorted.filter((number) => previousDraw.bonusNumbers.includes(number)).length : 0,
    averageNumberScore,
    deletionRiskScore,
    popularityAvoidanceScore,
    balanceScore: strategy === "random" ? balanceScore * 0.5 : balanceScore,
    diversityScore,
    explanationScore: (balanceScore + diversityScore + popularityAvoidanceScore) / 3
  };
}

function computeBalanceScore(
  game: GameType,
  numbers: number[],
  oddCount: number,
  lowCount: number,
  midCount: number,
  highCount: number,
  consecutivePairCount: number
): number {
  const idealOdd = game === "loto6" ? 3 : 4;
  const oddScore = 1 - Math.min(1, Math.abs(oddCount - idealOdd) / 3);
  const rangeScore = 1 - Math.min(1, (Math.abs(lowCount - 2) + Math.abs(midCount - 2) + Math.abs(highCount - 2)) / numbers.length);
  const sum = numbers.reduce((acc, number) => acc + number, 0);
  const target = game === "loto6" ? 132 : 134;
  const sumScore = 1 - Math.min(1, Math.abs(sum - target) / target);
  const consecutiveScore = game === "loto7" ? 1 - Math.min(0.4, Math.abs(consecutivePairCount - 1) * 0.15) : 1 - Math.min(0.5, consecutivePairCount * 0.15);
  return Math.max(0, (oddScore + rangeScore + sumScore + consecutiveScore) / 4);
}

function computeMaxConsecutiveRun(numbers: number[]): number {
  let best = 1;
  let current = 1;
  for (let index = 1; index < numbers.length; index += 1) {
    if (numbers[index] === numbers[index - 1] + 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

function groupCounts<T>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}
