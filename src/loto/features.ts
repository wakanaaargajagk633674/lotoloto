import { GAME_SPECS, numbersForGame } from "./constants";
import { shrinkFrequencies } from "./mathCore";
import { buildPopularityModel } from "./popularity";
import { createSeededRandom } from "./random";
import type { Draw, GameType, NumberFeature } from "./types";

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function std(values: number[]): number {
  const avg = mean(values);
  const variance = values.length
    ? values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
    : 0;
  return Math.sqrt(variance) || 1;
}

function zScore(value: number, values: number[]): number {
  return (value - mean(values)) / std(values);
}

export function zScoreMap(values: Map<number, number>, domain: number[]): Map<number, number> {
  const list = domain.map((number) => values.get(number) ?? 0);
  return new Map(domain.map((number, index) => [number, zScore(list[index], list)]));
}

export function computeNumberFeatures(
  game: GameType,
  history: Draw[],
  seed = 1,
  sourcePatternSignals: number[] = []
): NumberFeature[] {
  const spec = GAME_SPECS[game];
  const domain = numbersForGame(game);
  const random = createSeededRandom(seed + history.length * 97);
  const previousDraw = history.at(-1);
  const allGaps = new Map<number, number[]>();
  const currentGaps = new Map<number, number>();
  const maxGaps = new Map<number, number>();
  const totalFrequency = countWindow(history, history.length);
  const recent30 = countWindow(history, 30);
  const recent50 = countWindow(history, 50);
  const recent100 = countWindow(history, 100);
  const recent300 = countWindow(history, 300);
  const longZ = zScoreMap(totalFrequency, domain);
  const recentZ = zScoreMap(recent100, domain);
  const gapZSource = new Map<number, number>();

  for (const number of domain) {
    const seenIndexes = history
      .map((draw, index) => (draw.mainNumbers.includes(number) ? index : -1))
      .filter((index) => index >= 0);
    const gaps: number[] = [];
    let last = -1;
    for (const index of seenIndexes) {
      if (last >= 0) {
        gaps.push(index - last);
      }
      last = index;
    }
    const currentGap = last >= 0 ? history.length - 1 - last : history.length;
    allGaps.set(number, gaps);
    currentGaps.set(number, currentGap);
    maxGaps.set(number, Math.max(currentGap, ...gaps, 0));
    gapZSource.set(number, currentGap);
  }
  const gapZ = zScoreMap(gapZSource, domain);
  const sourcePatternSet = new Set(sourcePatternSignals);
  // 人気度はその時点までの履歴だけから推定する。未来の抽せん結果は参照しない。
  const popularityModel = buildPopularityModel(game, history);
  // 出現頻度はカイ二乗検定で説明できる分だけ一様へ縮小する。一様抽せんなら evidence ≈ 0。
  const shrinkage = shrinkFrequencies(totalFrequency, game, history.length);

  return domain.map((number) => {
    const rangeGroup = number <= Math.ceil(spec.maxNumber / 3) ? "low" : number <= Math.ceil((spec.maxNumber * 2) / 3) ? "mid" : "high";
    const birthdayPopularityRisk = number <= 31 ? 1 : 0.15;
    // 選ばれやすさは決め打ちではなく、事前分布と履歴からの推定を合成した値を使う。
    const popularityPrior = popularityModel.priorPopularity.get(number) ?? 0.5;
    const popularityEmpirical = popularityModel.empiricalPopularity?.get(number) ?? null;
    const popularityIndex = popularityModel.numberPopularity.get(number) ?? popularityPrior;
    const humanPopularityRisk = popularityIndex;
    const candidateAdjustmentScore = normalize01((recentZ.get(number) ?? 0) * -0.25 + (gapZ.get(number) ?? 0) * 0.35 + humanPopularityRisk * 0.15);
    const sourcePatternSignalScore = sourcePatternSet.has(number) ? 1 : 0;
    const sourcePatternBalanceScore = partitionScore(game, number);
    const gaps = allGaps.get(number) ?? [];
    const currentGap = currentGaps.get(number) ?? history.length;

    return {
      game,
      drawNumber: previousDraw?.drawNumber ?? 0,
      number,
      totalFrequency: totalFrequency.get(number) ?? 0,
      recent30Frequency: recent30.get(number) ?? 0,
      recent50Frequency: recent50.get(number) ?? 0,
      recent100Frequency: recent100.get(number) ?? 0,
      recent300Frequency: recent300.get(number) ?? 0,
      longTermFrequency: totalFrequency.get(number) ?? 0,
      lastSeenGap: currentGap,
      averageGap: mean(gaps),
      maxGap: maxGaps.get(number) ?? currentGap,
      currentGapZScore: gapZ.get(number) ?? 0,
      appearedInPreviousDraw: previousDraw?.mainNumbers.includes(number) ?? false,
      appearedInPreviousBonus: previousDraw?.bonusNumbers.includes(number) ?? false,
      oddEven: number % 2 === 0 ? "even" : "odd",
      rangeGroup,
      tensGroup: `${Math.floor(number / 10) * 10}s`,
      lastDigit: number % 10,
      over31Flag: number > 31,
      birthdayPopularityRisk,
      humanPopularityRisk,
      antiPopularityScore: 1 - humanPopularityRisk,
      popularityPrior,
      popularityEmpirical,
      popularityIndex,
      candidateAdjustmentScore,
      sourcePatternSignalScore,
      sourcePatternBalanceScore,
      carryoverContextScore: previousDraw?.carryoverAmount && previousDraw.carryoverAmount > 0 ? 0.5 : 0,
      posteriorProbability: shrinkage.posterior.get(number) ?? spec.mainCount / spec.maxNumber,
      frequencyEvidence: shrinkage.lambda,
      randomNoise: random(),
      scoreParts: {}
    };
  });
}

function countWindow(history: Draw[], windowSize: number): Map<number, number> {
  const selected = windowSize >= history.length ? history : history.slice(-windowSize);
  const counts = new Map<number, number>();
  for (const draw of selected) {
    for (const number of draw.mainNumbers) {
      counts.set(number, (counts.get(number) ?? 0) + 1);
    }
  }
  return counts;
}

function normalize01(value: number): number {
  return Math.max(0, Math.min(1, 0.5 + value / 4));
}

function partitionScore(game: GameType, number: number): number {
  const spec = GAME_SPECS[game];
  const bucketSize = game === "loto6" ? 6 : 7;
  const bucket = Math.floor((number - 1) / bucketSize);
  const centerBucket = Math.floor((spec.maxNumber - 1) / bucketSize / 2);
  return 1 - Math.min(1, Math.abs(bucket - centerBucket) / Math.max(1, centerBucket));
}
