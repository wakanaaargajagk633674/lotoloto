import { GAME_SPECS, numbersForGame } from "./constants";
import {
  estimateTicketVolumes,
  expectedJackpotPayout,
  fitPopularityRegression,
  type PayoutExpectation,
  type PopularityRegression
} from "./mathCore";
import type { Draw, GameType } from "./types";

/**
 * 人気度モデル。
 *
 * 抽せん自体はランダムなので、どの数字を選んでも当せん確率は変わらない。
 * 一方でロト6・ロト7はパリミュチュエル(山分け)方式なので、
 * 「同じ組み合わせを買っている人が何人いるか」は当せんした場合の受取額に影響する。
 * このモジュールは当せんしやすさではなく、当せんした場合の分配人数の目安だけを扱う。
 *
 * 推定は次の2層で行う。
 * 1. 事前分布: 誕生日・縁起・連番忌避など、購入者の選び方の一般的な傾向。
 * 2. 経験推定: その時点までの履歴に含まれる「本数字が少なく一致する等級」の口数を、
 *    固定賞金等級から復元した販売口数で正規化し、対数線形 (Ridge) 回帰で
 *    数字ごとの対数人気度 β を推定する (mathCore.fitPopularityRegression)。
 *    人気の数字を含む回ほど口数が増える性質を利用する。
 *
 * 2つは信頼度によるシュリンケージで合成し、データが少ないうちは事前分布に寄せる。
 * 推定には常にその時点までの履歴だけを使い、未来のデータは参照しない。
 */

export type PopularityModel = {
  game: GameType;
  drawsUsed: number;
  observationCount: number;
  confidence: number;
  /** 0 に近いほど選ばれにくく、1 に近いほど選ばれやすい */
  numberPopularity: Map<number, number>;
  priorPopularity: Map<number, number>;
  empiricalPopularity: Map<number, number> | null;
  /** 対数線形回帰の結果。データ不足なら null。 */
  regression: PopularityRegression | null;
  /**
   * 1等 (全数字一致) 向けに β を補正する倍率。
   * 参照等級は本数字のうち一部しか一致しないため、1 個の数字が効く割合は
   * おおよそ matches / mainCount に薄まる。その逆数で一次補正する。
   */
  jackpotScale: number;
  /** 直近の推定販売口数。 */
  ticketVolume: number;
};

const EMPIRICAL_SHRINKAGE_DRAWS = 200;
const modelCache = new Map<string, PopularityModel>();

/** 購入者の選び方に関する事前分布。当せんしやすさではなく選ばれやすさを表す。 */
export function priorPopularityScore(game: GameType, value: number): number {
  const spec = GAME_SPECS[game];
  let score = 0;

  // 誕生日の月と日の両方に使える 1-12 が最も選ばれやすい。
  if (value <= 12) {
    score += 1;
  } else if (value <= 31) {
    score += 0.72;
  } else {
    score += 0.22;
  }

  // 日本市場で縁起が良いとされる数字は選ばれやすく、忌避される数字は選ばれにくい。
  if (value === 7 || value === 8 || value === 3) {
    score += 0.12;
  }
  if (value === 4 || value === 9) {
    score -= 0.12;
  }

  // きりの良い数字はマークシート上でも選ばれやすい。
  if (value % 10 === 0) {
    score += 0.05;
  }
  if (value === 1) {
    score += 0.05;
  }
  // 最大値は「端は選ばれにくい」傾向がある。
  if (value === spec.maxNumber) {
    score -= 0.03;
  }

  return clamp01(score / 1.17);
}

/**
 * 対数線形回帰の β を 0-1 の人気度指数へ写す。
 * β は平均 0 なので、標準偏差 4 個分を 0-1 に収める線形変換で事前分布と同じ尺度にそろえる。
 */
function betaToPopularityIndex(game: GameType, regression: PopularityRegression): Map<number, number> {
  const domain = numbersForGame(game);
  const raw = domain.map((number) => regression.beta.get(number) ?? 0);
  const rawAvg = mean(raw);
  const rawStd = std(raw);
  return new Map(domain.map((number, index) => [number, clamp01(0.5 + (raw[index] - rawAvg) / (rawStd * 4))]));
}

function jackpotScaleFor(game: GameType): number {
  const spec = GAME_SPECS[game];
  const referenceMatches = game === "loto6" ? 3 : 4;
  return spec.mainCount / referenceMatches;
}

export function buildPopularityModel(game: GameType, history: Draw[]): PopularityModel {
  const latest = history.at(-1)?.drawNumber ?? 0;
  const cacheKey = `${game}:${history.length}:${latest}`;
  const cached = modelCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const domain = numbersForGame(game);
  const prior = new Map(domain.map((number) => [number, priorPopularityScore(game, number)]));
  const regression = fitPopularityRegression(game, history);
  const empirical = regression ? betaToPopularityIndex(game, regression) : null;
  const observationCount = regression?.observations ?? 0;
  const confidence = observationCount / (observationCount + EMPIRICAL_SHRINKAGE_DRAWS);
  const volumes = estimateTicketVolumes(game, history);
  const ticketVolume = volumes.get(latest) ?? 0;

  const numberPopularity = new Map(
    domain.map((number) => {
      const priorValue = prior.get(number) ?? 0.5;
      const empiricalValue = empirical?.get(number);
      const blended =
        empiricalValue === undefined ? priorValue : (1 - confidence) * priorValue + confidence * empiricalValue;
      return [number, clamp01(blended)];
    })
  );

  const model: PopularityModel = {
    game,
    drawsUsed: history.length,
    observationCount,
    confidence,
    numberPopularity,
    priorPopularity: prior,
    empiricalPopularity: empirical,
    regression,
    jackpotScale: jackpotScaleFor(game),
    ticketVolume
  };

  if (modelCache.size > 64) {
    modelCache.clear();
  }
  modelCache.set(cacheKey, model);
  return model;
}

export type CombinationPopularity = {
  /** 0 に近いほど買われにくく、1 に近いほど買われやすい */
  index: number;
  /** index の裏返し。高いほど当せん時の分配人数が少ないと見込まれる */
  expectedShareScore: number;
  /** 回帰と口数推定から導いた 1等の期待受取係数。データ不足なら null。 */
  payout: PayoutExpectation | null;
  reasons: string[];
};

/**
 * 1等の期待受取係数 (0-1) を求める。
 * 回帰の β を 1等向けに補正し、推定販売口数から E[1 / (1 + 同時当せん者数)] を閉形式で計算する。
 */
export function combinationPayoutExpectation(game: GameType, numbers: number[], model: PopularityModel): PayoutExpectation | null {
  if (!model.regression || model.ticketVolume <= 0) {
    return null;
  }
  const scaledBeta = new Map([...model.regression.beta.entries()].map(([number, beta]) => [number, beta * model.jackpotScale]));
  return expectedJackpotPayout(game, numbers, scaledBeta, model.ticketVolume);
}

/** payoutFactor は実データで概ね 0.35-0.85 に収まるため、その帯を 0-1 に引き伸ばして指数化する。 */
function payoutFactorToScore(payoutFactor: number): number {
  return clamp01((payoutFactor - 0.3) / 0.55);
}

/**
 * 組み合わせ全体の選ばれやすさ。
 * 数字単体の人気度に加えて、マークシート上の選び方のクセを加味する。
 */
export function scoreCombinationPopularity(
  game: GameType,
  numbers: number[],
  model: PopularityModel
): CombinationPopularity {
  const spec = GAME_SPECS[game];
  const sorted = [...numbers].sort((a, b) => a - b);
  const reasons: string[] = [];
  const averagePopularity =
    sorted.reduce((sum, number) => sum + (model.numberPopularity.get(number) ?? 0.5), 0) / Math.max(1, sorted.length);

  let index = averagePopularity * 0.55;

  if (sorted.every((number) => number <= 31)) {
    index += 0.14;
    reasons.push("すべて31以下で、誕生日で選ばれやすい範囲に収まっています。");
  }
  const monthLike = sorted.filter((number) => number <= 12).length;
  if (monthLike >= Math.ceil(sorted.length / 2)) {
    index += 0.08;
    reasons.push("1から12の数字が多く、月日の選び方と重なりやすい並びです。");
  }

  const gaps = sorted.slice(1).map((number, position) => number - sorted[position]);
  if (gaps.length > 0 && new Set(gaps).size === 1) {
    index += 0.1;
    reasons.push("等間隔の並びで、マークシート上で選ばれやすい形です。");
  }

  const lastDigitCounts = new Map<number, number>();
  for (const number of sorted) {
    const digit = number % 10;
    lastDigitCounts.set(digit, (lastDigitCounts.get(digit) ?? 0) + 1);
  }
  if (Math.max(...lastDigitCounts.values()) >= 3) {
    index += 0.05;
    reasons.push("下1桁がそろった数字が多い並びです。");
  }

  const sum = sorted.reduce((total, number) => total + number, 0);
  const center = (spec.maxNumber + 1) * 0.5 * spec.mainCount;
  const centralBand = spec.maxNumber * 0.35;
  if (Math.abs(sum - center) <= centralBand) {
    index += 0.07;
    reasons.push("合計値が中央付近で、多くの購入者が作りやすい帯に入っています。");
  }

  // 連番は「ランダムらしくない」と誤解されて避けられやすいため、含むほど重なりにくい。
  const consecutivePairs = gaps.filter((gap) => gap === 1).length;
  if (consecutivePairs >= 1) {
    index -= 0.06 * Math.min(2, consecutivePairs);
    reasons.push("連番を含み、避けられやすい形のため重なりにくいと見ています。");
  }

  const over31 = sorted.filter((number) => number > 31).length;
  if (over31 >= 2) {
    index -= 0.06;
    reasons.push("32以上の数字を複数含み、誕生日の選び方と重なりにくい並びです。");
  }

  const bounded = clamp01(index);
  const payout = combinationPayoutExpectation(game, sorted, model);
  // 回帰が使えるときは、ヒューリスティックな指数と閉形式の期待受取係数を半々で合成する。
  // 回帰は数字単体の人気しか見ないので、並びのクセ (等間隔・下1桁など) は引き続き指数側で扱う。
  const expectedShareScore = payout ? 0.5 * (1 - bounded) + 0.5 * payoutFactorToScore(payout.payoutFactor) : 1 - bounded;
  if (payout) {
    reasons.unshift(
      `過去の口数データから推定すると、この組み合わせを持つ人は平均的な買い方の約 ${payout.relativePopularity.toFixed(2)} 倍で、1等なら同時当せんが平均 ${payout.expectedCoWinners.toFixed(2)} 人前後と見込まれます。`
    );
  }
  return {
    index: bounded,
    expectedShareScore,
    payout,
    reasons
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function std(values: number[]): number {
  const avg = mean(values);
  const variance = values.length ? values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length : 0;
  return Math.sqrt(variance) || 1;
}
