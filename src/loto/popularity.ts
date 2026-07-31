import { GAME_SPECS, numbersForGame } from "./constants";
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
 * 2. 経験推定: その時点までの履歴に含まれる「本数字が少なく一致する等級」の口数を
 *    販売口数で正規化した値。人気の数字を含む回ほど口数が増える性質を利用する。
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
 * 本数字の一致数が少ない等級の口数から、数字ごとの選ばれやすさを推定する。
 * 販売口数で正規化し、回ごとに標準化してから数字別に平均を取る。
 */
function estimateEmpiricalPopularity(game: GameType, history: Draw[]): { map: Map<number, number>; observations: number } | null {
  const spec = GAME_SPECS[game];
  const tier = game === "loto6" ? 5 : 5;
  const samples: Array<{ numbers: number[]; logRate: number }> = [];

  for (const draw of history) {
    if (!draw.salesAmount || draw.salesAmount <= 0) {
      continue;
    }
    const winners = draw.prizeTiers.find((prize) => prize.tier === tier)?.winners;
    if (winners === null || winners === undefined || winners <= 0) {
      continue;
    }
    const soldTickets = draw.salesAmount / spec.ticketPriceYen;
    if (soldTickets <= 0) {
      continue;
    }
    samples.push({ numbers: draw.mainNumbers, logRate: Math.log(winners / soldTickets) });
  }

  if (samples.length < 30) {
    return null;
  }

  const rates = samples.map((sample) => sample.logRate);
  const avg = mean(rates);
  const deviation = std(rates);
  const sums = new Map<number, number>();
  const counts = new Map<number, number>();

  for (const sample of samples) {
    const standardized = (sample.logRate - avg) / deviation;
    for (const number of sample.numbers) {
      sums.set(number, (sums.get(number) ?? 0) + standardized);
      counts.set(number, (counts.get(number) ?? 0) + 1);
    }
  }

  const domain = numbersForGame(game);
  const raw = domain.map((number) => {
    const count = counts.get(number) ?? 0;
    return count > 0 ? (sums.get(number) ?? 0) / count : 0;
  });
  const rawAvg = mean(raw);
  const rawStd = std(raw);

  return {
    map: new Map(domain.map((number, index) => [number, clamp01(0.5 + (raw[index] - rawAvg) / (rawStd * 4))])),
    observations: samples.length
  };
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
  const empirical = estimateEmpiricalPopularity(game, history);
  const observationCount = empirical?.observations ?? 0;
  const confidence = observationCount / (observationCount + EMPIRICAL_SHRINKAGE_DRAWS);

  const numberPopularity = new Map(
    domain.map((number) => {
      const priorValue = prior.get(number) ?? 0.5;
      const empiricalValue = empirical?.map.get(number);
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
    empiricalPopularity: empirical?.map ?? null
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
  reasons: string[];
};

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
  return {
    index: bounded,
    expectedShareScore: 1 - bounded,
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
