import { strategyWeights } from "@/config/strategyWeights";
import { GAME_SPECS } from "./constants";
import { zScoreMap } from "./features";
import { buildPopularityModel, scoreCombinationPopularity } from "./popularity";
import type { CombinationScores, Draw, GameType, NumberFeature, NumberScore, StrategyType } from "./types";

/** 頻度シグナルに常に残す最低限の割合。戦略テーマの個性を保つための下限で、根拠の主張ではない。 */
export const EVIDENCE_FLOOR = 0.35;

export function scoreNumbers(strategy: StrategyType, features: NumberFeature[]): NumberScore[] {
  const weights = strategyWeights[strategy];
  const domain = features.map((feature) => feature.number);
  const recentZ = zScoreMap(new Map(features.map((feature) => [feature.number, feature.recent100Frequency])), domain);
  const longZ = zScoreMap(new Map(features.map((feature) => [feature.number, feature.longTermFrequency])), domain);
  const gapZ = zScoreMap(new Map(features.map((feature) => [feature.number, feature.lastSeenGap])), domain);

  return features.map((feature) => {
    // 頻度・間隔のシグナルは、カイ二乗検定で偶然と区別できた分 (frequencyEvidence) だけ強め、
    // 残りは「戦略テーマとしての好み」の最低限 (EVIDENCE_FLOOR) に抑える。
    // 実データでは evidence ≈ 0 なので、hot / cold は当たりやすさの主張にはならない。
    const evidenceGate = EVIDENCE_FLOOR + (1 - EVIDENCE_FLOOR) * feature.frequencyEvidence;
    const parts = {
      recent: weights.recent * (recentZ.get(feature.number) ?? 0) * evidenceGate,
      long: weights.long * (longZ.get(feature.number) ?? 0) * evidenceGate,
      gap: weights.gap * (gapZ.get(feature.number) ?? 0) * evidenceGate,
      prev: weights.prev * (feature.appearedInPreviousDraw ? -1 : 0.15),
      bonus: weights.bonus * (feature.appearedInPreviousBonus ? 0.05 : 0),
      anti_pop: weights.anti_pop * feature.antiPopularityScore,
      ev_share: weights.ev_share * (1 - feature.popularityIndex),
      candidate_tuning: weights.candidate_tuning * -feature.candidateAdjustmentScore,
      pattern_filter: weights.pattern_filter * (feature.sourcePatternBalanceScore - feature.sourcePatternSignalScore),
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
  const previousDrawOverlap = previousDraw ? sorted.filter((number) => previousDraw.mainNumbers.includes(number)).length : 0;
  const previousOverlap = scorePreviousDrawOverlapPattern(game, previousDrawOverlap, history);
  const averageNumberScore =
    sorted.reduce((sum, number) => sum + (scoreByNumber.get(number)?.total ?? 0), 0) / sorted.length;
  const lowPrioritySignalScore =
    sorted.reduce((sum, number) => sum + (scoreByNumber.get(number)?.feature.candidateAdjustmentScore ?? 0), 0) /
    sorted.length;
  const popularityAvoidanceScore =
    sorted.reduce((sum, number) => sum + (scoreByNumber.get(number)?.feature.antiPopularityScore ?? 0), 0) /
    sorted.length;
  const popularityModel = buildPopularityModel(game, history);
  const combinationPopularity = scoreCombinationPopularity(game, sorted, popularityModel);
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
    previousDrawOverlap,
    previousBonusOverlap: previousDraw ? sorted.filter((number) => previousDraw.bonusNumbers.includes(number)).length : 0,
    previousDrawOverlapRate: previousOverlap.rate,
    previousDrawOverlapScore: previousOverlap.score,
    previousDrawOverlapBand: previousOverlap.band,
    averageNumberScore,
    lowPrioritySignalScore,
    popularityAvoidanceScore,
    combinationPopularityIndex: combinationPopularity.index,
    expectedShareScore: combinationPopularity.expectedShareScore,
    expectedShareReasons: combinationPopularity.reasons,
    relativePopularity: combinationPopularity.payout?.relativePopularity ?? null,
    expectedCoWinners: combinationPopularity.payout?.expectedCoWinners ?? null,
    payoutFactor: combinationPopularity.payout?.payoutFactor ?? null,
    balanceScore: strategy === "pure_random" ? balanceScore * 0.5 : balanceScore,
    diversityScore,
    explanationScore: (balanceScore + diversityScore + combinationPopularity.expectedShareScore) / 3
  };
}

export function scorePreviousDrawOverlapPattern(
  game: GameType,
  overlap: number,
  history: Draw[]
): { rate: number; score: number; band: "common" | "normal" | "rare" | "extreme" } {
  const distribution = buildPreviousDrawOverlapRates(game, history);
  const rate = distribution.get(overlap) ?? 0;
  const maxRate = Math.max(...distribution.values(), 0.001);
  const normalized = rate / maxRate;
  const score = Math.max(0.15, Math.min(1, normalized));
  return {
    rate,
    score,
    band: rate >= 0.25 ? "common" : rate >= 0.08 ? "normal" : rate >= 0.01 ? "rare" : "extreme"
  };
}

function buildPreviousDrawOverlapRates(game: GameType, history: Draw[]): Map<number, number> {
  const spec = GAME_SPECS[game];
  const sortedHistory = [...history].sort((a, b) => a.drawNumber - b.drawNumber);
  const counts = new Map<number, number>();
  for (let index = 1; index < sortedHistory.length; index += 1) {
    const previousMain = sortedHistory[index - 1].mainNumbers;
    const overlap = sortedHistory[index].mainNumbers.filter((number) => previousMain.includes(number)).length;
    counts.set(overlap, (counts.get(overlap) ?? 0) + 1);
  }

  if (sortedHistory.length > 1) {
    const total = sortedHistory.length - 1;
    return new Map(Array.from({ length: spec.mainCount + 1 }, (_, overlap) => [overlap, (counts.get(overlap) ?? 0) / total]));
  }

  const denominator = combinations(spec.maxNumber, spec.mainCount);
  return new Map(
    Array.from({ length: spec.mainCount + 1 }, (_, overlap) => [
      overlap,
      (combinations(spec.mainCount, overlap) * combinations(spec.maxNumber - spec.mainCount, spec.mainCount - overlap)) /
        denominator
    ])
  );
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

function combinations(n: number, k: number): number {
  if (k < 0 || k > n) {
    return 0;
  }
  let result = 1;
  for (let index = 1; index <= k; index += 1) {
    result = (result * (n - k + index)) / index;
  }
  return result;
}
