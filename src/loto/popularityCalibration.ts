import { GAME_SPECS, numbersForGame } from "./constants";
import { combinations, estimateTicketVolumes, solveLinearSystem } from "./mathCore";
import type { Draw, GameType } from "./types";

/**
 * 人気度モデルの標本外検証。
 *
 * 当せん確率は組み合わせによらず一定なので、予想ロジックが数理的に改善できるのは
 * 「当せんした場合に何人と山分けになるか」の見積もりだけである。
 * このモジュールは、その見積もり (数字ごとの対数人気度 γ) が
 * 未来の回の当せん口数を本当に説明できるかをウォークフォワードで検証する。
 *
 * すべての予測は、その回より前の回だけで学習した係数を使う。
 */

/** 等級ごとの一致条件。bonus は「ボーナス数字も一致」が条件かどうか。 */
export type TierDefinition = { tier: number; matches: number; bonus: "required" | "excluded" | "ignored" };

export const TIER_DEFINITIONS: Record<GameType, TierDefinition[]> = {
  loto6: [
    { tier: 1, matches: 6, bonus: "ignored" },
    { tier: 2, matches: 5, bonus: "required" },
    { tier: 3, matches: 5, bonus: "excluded" },
    { tier: 4, matches: 4, bonus: "ignored" },
    { tier: 5, matches: 3, bonus: "ignored" }
  ],
  loto7: [
    { tier: 1, matches: 7, bonus: "ignored" },
    { tier: 2, matches: 6, bonus: "required" },
    { tier: 3, matches: 6, bonus: "excluded" },
    { tier: 4, matches: 5, bonus: "ignored" },
    { tier: 5, matches: 4, bonus: "ignored" },
    { tier: 6, matches: 3, bonus: "required" }
  ]
};

/** 1 口がその等級に当たる理論確率 (一様に選んだ場合)。 */
export function tierProbability(game: GameType, definition: TierDefinition): number {
  const spec = GAME_SPECS[game];
  const k = definition.matches;
  const others = spec.maxNumber - spec.mainCount;
  const total = combinations(spec.maxNumber, spec.mainCount);
  const nonMatchSlots = spec.mainCount - k;
  if (definition.bonus === "ignored") {
    return (combinations(spec.mainCount, k) * combinations(others, nonMatchSlots)) / total;
  }
  // 外れ枠 (mainCount - k 個) にボーナス数字が 1 個以上入るかどうか。
  const withoutBonus = combinations(others - spec.bonusCount, nonMatchSlots);
  const withBonus = combinations(others, nonMatchSlots) - withoutBonus;
  const outside = definition.bonus === "required" ? withBonus : withoutBonus;
  return (combinations(spec.mainCount, k) * outside) / total;
}

/**
 * k 個一致の等級の「当せん口数の対数超過」が、当せん数字の対数人気度の和 Σγ に掛かる係数。
 *
 * 購入口の選ばれやすさを exp(Σ_{j∈口} γ_j) (Σ_all γ = 0) とすると、一次近似で
 *   log(W_k / (N p_k)) ≈ [k/m − (m−k)/(n−m)] · Σ_{i∈当せん} γ_i
 * になる。第1項は一致した k 個、第2項は外れ枠に入る「当せん数字以外」の平均人気が
 * 当せん数字の人気の裏返しになる分。1等 (k = m) では 1。
 */
export function tierPopularityCoefficient(game: GameType, matches: number): number {
  const spec = GAME_SPECS[game];
  const m = spec.mainCount;
  return matches / m - (m - matches) / (spec.maxNumber - m);
}

/** 組み合わせ単位の「並びのクセ」。数字単体の人気の和では表せない非線形効果の候補。 */
export const PATTERN_FEATURE_NAMES = ["all_le31", "month_heavy", "same_last_digit3", "consecutive", "over31_2plus"] as const;

export function combinationPatternFeatures(game: GameType, numbers: number[]): number[] {
  const sorted = [...numbers].sort((a, b) => a - b);
  const monthLike = sorted.filter((number) => number <= 12).length;
  const digitCounts = new Map<number, number>();
  for (const number of sorted) {
    digitCounts.set(number % 10, (digitCounts.get(number % 10) ?? 0) + 1);
  }
  const consecutive = sorted.slice(1).filter((number, index) => number === sorted[index] + 1).length;
  return [
    sorted.every((number) => number <= 31) ? 1 : 0,
    monthLike >= Math.ceil(sorted.length / 2) ? 1 : 0,
    Math.max(...digitCounts.values()) >= 3 ? 1 : 0,
    Math.min(2, consecutive),
    sorted.filter((number) => number > 31).length >= 2 ? 1 : 0
  ];
}

export type TierObservation = {
  drawNumber: number;
  index: number;
  tier: number;
  coefficient: number;
  y: number;
  winners: number;
  expected: number;
  numbers: number[];
};

/** 各回・各等級の y = log(W / (N̂ p)) を作る。N̂ はその回までの固定等級から復元した販売口数。 */
export function buildTierObservations(game: GameType, history: Draw[], tiers: readonly number[]): TierObservation[] {
  const volumes = estimateTicketVolumes(game, history);
  const definitions = TIER_DEFINITIONS[game].filter((definition) => tiers.includes(definition.tier));
  const rows: TierObservation[] = [];
  history.forEach((draw, index) => {
    const volume = volumes.get(draw.drawNumber);
    if (!volume || volume <= 0) {
      return;
    }
    for (const definition of definitions) {
      const winners = draw.prizeTiers.find((prize) => prize.tier === definition.tier)?.winners ?? null;
      if (winners === null || winners <= 0) {
        continue;
      }
      const expected = volume * tierProbability(game, definition);
      rows.push({
        drawNumber: draw.drawNumber,
        index,
        tier: definition.tier,
        coefficient: tierPopularityCoefficient(game, definition.matches),
        y: Math.log(winners / expected),
        winners,
        expected,
        numbers: draw.mainNumbers
      });
    }
  });
  return rows;
}

export type PopularityFitOptions = {
  ridge: number;
  /** 組み合わせ単位の並びのクセを説明変数に加えるか。 */
  patterns: boolean;
};

/**
 * 等級をまたいで共有する 1等単位の対数人気度 γ を、重み付き Ridge で推定するための累積器。
 * 行を足していくだけで正規方程式を更新できるので、ウォークフォワードの再学習が安い。
 * 説明変数: [等級ごとの切片 (罰則なし)] + [c_k · 1(i∈当せん)] + [c_k · 並びのクセ]。
 */
export class PopularityAccumulator {
  readonly domain: number[];
  readonly tiers: number[];
  readonly dimension: number;
  private readonly xtx: number[][];
  private readonly xty: number[];
  count = 0;

  constructor(
    readonly game: GameType,
    tiers: readonly number[],
    readonly options: PopularityFitOptions
  ) {
    this.domain = numbersForGame(game);
    this.tiers = [...tiers];
    this.dimension = this.tiers.length + this.domain.length + (options.patterns ? PATTERN_FEATURE_NAMES.length : 0);
    this.xtx = Array.from({ length: this.dimension }, () => new Array<number>(this.dimension).fill(0));
    this.xty = new Array<number>(this.dimension).fill(0);
  }

  features(row: Pick<TierObservation, "tier" | "coefficient" | "numbers">): number[] {
    const x = new Array<number>(this.dimension).fill(0);
    const tierIndex = this.tiers.indexOf(row.tier);
    if (tierIndex >= 0) {
      x[tierIndex] = 1;
    }
    const offset = this.tiers.length;
    for (const number of row.numbers) {
      const position = this.domain.indexOf(number);
      if (position >= 0) {
        x[offset + position] = row.coefficient;
      }
    }
    if (this.options.patterns) {
      const patternOffset = offset + this.domain.length;
      combinationPatternFeatures(this.game, row.numbers).forEach((value, index) => {
        x[patternOffset + index] = row.coefficient * value;
      });
    }
    return x;
  }

  add(row: TierObservation): void {
    const x = this.features(row);
    for (let i = 0; i < this.dimension; i += 1) {
      if (x[i] === 0) continue;
      this.xty[i] += x[i] * row.y;
      for (let j = 0; j < this.dimension; j += 1) {
        this.xtx[i][j] += x[i] * x[j];
      }
    }
    this.count += 1;
  }

  solve(): number[] | null {
    const matrix = this.xtx.map((row) => [...row]);
    for (let i = this.tiers.length; i < this.dimension; i += 1) {
      matrix[i][i] += this.options.ridge;
    }
    // 観測の無い等級の切片が特異にならないよう、ごく弱い罰則を入れておく。
    for (let i = 0; i < this.tiers.length; i += 1) {
      matrix[i][i] += 1e-6;
    }
    return solveLinearSystem(matrix, this.xty);
  }

  predict(solution: number[], row: Pick<TierObservation, "tier" | "coefficient" | "numbers">): number {
    const x = this.features(row);
    return x.reduce((sum, value, index) => sum + value * solution[index], 0);
  }

  /** 1等単位の数字ごとの対数人気度 γ (平均 0 に中心化)。 */
  gamma(solution: number[]): Map<number, number> {
    const offset = this.tiers.length;
    const raw = this.domain.map((_, index) => solution[offset + index]);
    const average = raw.reduce((sum, value) => sum + value, 0) / raw.length;
    return new Map(this.domain.map((number, index) => [number, raw[index] - average]));
  }

  patternCoefficients(solution: number[]): number[] {
    if (!this.options.patterns) {
      return [];
    }
    const offset = this.tiers.length + this.domain.length;
    return PATTERN_FEATURE_NAMES.map((_, index) => solution[offset + index]);
  }
}

export type WalkForwardResult = {
  game: GameType;
  trainTiers: readonly number[];
  evalTier: number;
  ridge: number;
  patterns: boolean;
  testCount: number;
  /** 標本外 R² (基準は学習期間の平均)。0 以下なら予測力なし。 */
  oosR2: number;
  correlation: number;
  /** 最終時点の γ。 */
  finalGamma: Map<number, number>;
  finalPatterns: number[];
  /** 回ごとの標本外予測 Σγ (1等単位)。1等の口数検定に使う。 */
  predictedLogPopularity: Map<number, number>;
};

/**
 * 拡大窓のウォークフォワード。refitEvery 回ごとに再学習し、次の区間を標本外で予測する。
 * 評価は evalTier の y だけで行い、学習に使う等級を増やしたときの効果を公平に比べる。
 */
export function walkForwardPopularity(
  game: GameType,
  history: Draw[],
  config: { trainTiers: readonly number[]; evalTier: number; ridge: number; patterns: boolean; warmup: number; refitEvery: number }
): WalkForwardResult {
  const allTiers = [...new Set([...config.trainTiers, config.evalTier])];
  const rows = buildTierObservations(game, history, allTiers);
  const byIndex = new Map<number, TierObservation[]>();
  for (const row of rows) {
    byIndex.set(row.index, [...(byIndex.get(row.index) ?? []), row]);
  }
  const accumulator = new PopularityAccumulator(game, allTiers, { ridge: config.ridge, patterns: config.patterns });
  const actual: number[] = [];
  const predicted: number[] = [];
  const baseline: number[] = [];
  const predictedLogPopularity = new Map<number, number>();
  let solution: number[] | null = null;
  let evalSum = 0;
  let evalCount = 0;

  for (let index = 0; index < history.length; index += 1) {
    const draw = history[index];
    if (index >= config.warmup) {
      if (solution === null || (index - config.warmup) % config.refitEvery === 0) {
        solution = accumulator.solve();
      }
      if (solution) {
        const gamma = accumulator.gamma(solution);
        const patternCoefficients = accumulator.patternCoefficients(solution);
        const patternValues = config.patterns ? combinationPatternFeatures(game, draw.mainNumbers) : [];
        const logPopularity =
          draw.mainNumbers.reduce((sum, number) => sum + (gamma.get(number) ?? 0), 0) +
          patternValues.reduce((sum, value, position) => sum + value * (patternCoefficients[position] ?? 0), 0);
        predictedLogPopularity.set(draw.drawNumber, logPopularity);
        for (const row of byIndex.get(index) ?? []) {
          if (row.tier !== config.evalTier) continue;
          actual.push(row.y);
          predicted.push(accumulator.predict(solution, row));
          baseline.push(evalCount > 0 ? evalSum / evalCount : 0);
        }
      }
    }
    for (const row of byIndex.get(index) ?? []) {
      if (config.trainTiers.includes(row.tier)) {
        accumulator.add(row);
      }
      if (row.tier === config.evalTier) {
        evalSum += row.y;
        evalCount += 1;
      }
    }
  }

  const finalSolution = accumulator.solve();
  const sse = actual.reduce((sum, value, i) => sum + (value - predicted[i]) ** 2, 0);
  const sst = actual.reduce((sum, value, i) => sum + (value - baseline[i]) ** 2, 0);
  return {
    game,
    trainTiers: config.trainTiers,
    evalTier: config.evalTier,
    ridge: config.ridge,
    patterns: config.patterns,
    testCount: actual.length,
    oosR2: sst > 0 ? 1 - sse / sst : 0,
    correlation: pearson(actual, predicted),
    finalGamma: finalSolution ? accumulator.gamma(finalSolution) : new Map(),
    finalPatterns: finalSolution ? accumulator.patternCoefficients(finalSolution) : [],
    predictedLogPopularity
  };
}

export type JackpotCalibration = {
  game: GameType;
  draws: number;
  totalWinners: number;
  /** log λ_t = log(N̂_t / C) + a + s · Σγ̂_t の推定値。理論値は a ≈ 0, s ≈ 1。 */
  intercept: number;
  slope: number;
  slopeStdError: number;
  /** s = 0 (人気差なし) に対する尤度比統計量と p 値 (自由度 1)。 */
  likelihoodRatio: number;
  pValue: number;
};

/**
 * 1等の当せん口数による直接検証。
 * 1等口数は「その回の当せん組み合わせを買った人数」そのものなので Poisson(N q) に従う。
 * 標本外で予測した Σγ̂ が 1等口数を説明できるかを Poisson 回帰 (2 パラメータ) で確かめる。
 */
export function calibrateJackpot(
  game: GameType,
  history: Draw[],
  predictedLogPopularity: Map<number, number>
): JackpotCalibration {
  const spec = GAME_SPECS[game];
  const volumes = estimateTicketVolumes(game, history);
  const total = combinations(spec.maxNumber, spec.mainCount);
  const rows: Array<{ offset: number; x: number; w: number }> = [];
  for (const draw of history) {
    const x = predictedLogPopularity.get(draw.drawNumber);
    const volume = volumes.get(draw.drawNumber);
    const winners = draw.prizeTiers.find((prize) => prize.tier === 1)?.winners;
    if (x === undefined || !volume || winners === null || winners === undefined) continue;
    rows.push({ offset: Math.log(volume / total), x, w: winners });
  }
  const fitFull = poissonFit(rows, true);
  const fitNull = poissonFit(rows, false);
  const likelihoodRatio = Math.max(0, 2 * (fitFull.logLikelihood - fitNull.logLikelihood));
  return {
    game,
    draws: rows.length,
    totalWinners: rows.reduce((sum, row) => sum + row.w, 0),
    intercept: fitFull.a,
    slope: fitFull.s,
    slopeStdError: fitFull.slopeStdError,
    likelihoodRatio,
    pValue: chiSquare1Survival(likelihoodRatio)
  };
}

function poissonFit(
  rows: Array<{ offset: number; x: number; w: number }>,
  withSlope: boolean
): { a: number; s: number; logLikelihood: number; slopeStdError: number } {
  let a = 0;
  let s = 0;
  let information: number[][] = [
    [1, 0],
    [0, 1]
  ];
  for (let iteration = 0; iteration < 50; iteration += 1) {
    let ga = 0;
    let gs = 0;
    let haa = 0;
    let has = 0;
    let hss = 0;
    for (const row of rows) {
      const lambda = Math.exp(row.offset + a + s * row.x);
      ga += row.w - lambda;
      gs += (row.w - lambda) * row.x;
      haa += lambda;
      has += lambda * row.x;
      hss += lambda * row.x * row.x;
    }
    information = [
      [haa, has],
      [has, hss]
    ];
    let da: number;
    let ds: number;
    if (withSlope) {
      const det = haa * hss - has * has;
      if (Math.abs(det) < 1e-12) break;
      da = (hss * ga - has * gs) / det;
      ds = (haa * gs - has * ga) / det;
    } else {
      da = haa > 0 ? ga / haa : 0;
      ds = 0;
    }
    a += da;
    s += ds;
    if (Math.abs(da) + Math.abs(ds) < 1e-10) break;
  }
  const logLikelihood = rows.reduce((sum, row) => {
    const eta = row.offset + a + s * row.x;
    return sum + row.w * eta - Math.exp(eta) - logFactorial(row.w);
  }, 0);
  const det = information[0][0] * information[1][1] - information[0][1] ** 2;
  const slopeStdError = withSlope && det > 0 ? Math.sqrt(information[0][0] / det) : Number.NaN;
  return { a, s, logLikelihood, slopeStdError };
}

function logFactorial(n: number): number {
  let sum = 0;
  for (let i = 2; i <= n; i += 1) sum += Math.log(i);
  return sum;
}

/** 自由度 1 のカイ二乗分布の上側確率。 */
export function chiSquare1Survival(x: number): number {
  if (x <= 0) return 1;
  return erfc(Math.sqrt(x / 2));
}

function erfc(x: number): number {
  // Numerical Recipes の erfcc (相対誤差 < 1.2e-7)。
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851173 + t * (-0.82215223 + t * 0.17087277))))))))
    );
  return x >= 0 ? r : 2 - r;
}

function pearson(a: number[], b: number[]): number {
  if (a.length < 2) return 0;
  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < a.length; i += 1) {
    cov += (a[i] - meanA) * (b[i] - meanB);
    varA += (a[i] - meanA) ** 2;
    varB += (b[i] - meanB) ** 2;
  }
  return varA > 0 && varB > 0 ? cov / Math.sqrt(varA * varB) : 0;
}

// ---------------------------------------------------------------------------
// 1等口数による較正 (本番で使う人気度モデル)
// ---------------------------------------------------------------------------

export type CalibrationSettings = {
  trainTiers: readonly number[];
  ridge: number;
  warmup: number;
  refitEvery: number;
  /** 傾き s の事前分布。理論値は 1 (tierPopularityCoefficient による換算が正しければ)。 */
  slopePriorMean: number;
  slopePriorSd: number;
  /** 並びのクセ δ の事前分布 N(0, sd²)。0 なら並びのクセは使わない。 */
  patternPriorSd: number;
  /** これより 1等の観測回数が少なければ較正せず理論値 (s = 1, δ = 0) を使う。 */
  minCalibrationDraws: number;
};

export type CalibratedPopularity = {
  game: GameType;
  /** 1等単位の数字ごとの対数人気度 γ (Σ = 0)。 */
  gamma: Map<number, number>;
  /** log λ = log(N̂/C) + intercept + slope · Σγ + Σ δ_j · pattern_j */
  intercept: number;
  slope: number;
  slopeStdError: number;
  patternCoefficients: number[];
  patternStdErrors: number[];
  calibrationDraws: number;
  calibrationWinners: number;
  /** 学習に使った最後の回。 */
  trainedThroughDraw: number;
};

type CalibrationRow = { offset: number; x: number; patterns: number[]; w: number };

/**
 * 事前分布つきの Poisson 回帰 (Newton 法)。
 * 目的関数 = Σ [w η − e^η] − (s − μ_s)² / 2σ_s² − Σ δ² / 2σ_δ²,  η = offset + a + s x + δ·p。
 */
export function fitPenalizedJackpotPoisson(
  rows: CalibrationRow[],
  settings: Pick<CalibrationSettings, "slopePriorMean" | "slopePriorSd" | "patternPriorSd">,
  usePatterns: boolean
): { theta: number[]; stdErrors: number[]; logLikelihood: number } {
  const patternCount = usePatterns ? PATTERN_FEATURE_NAMES.length : 0;
  const size = 2 + patternCount;
  const theta = new Array<number>(size).fill(0);
  theta[1] = settings.slopePriorMean;
  const design = (row: CalibrationRow) => [1, row.x, ...(usePatterns ? row.patterns : [])];
  let hessian: number[][] = [];
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const gradient = new Array<number>(size).fill(0);
    hessian = Array.from({ length: size }, () => new Array<number>(size).fill(0));
    for (const row of rows) {
      const z = design(row);
      const lambda = Math.exp(row.offset + z.reduce((sum, value, i) => sum + value * theta[i], 0));
      for (let i = 0; i < size; i += 1) {
        gradient[i] += (row.w - lambda) * z[i];
        for (let j = 0; j < size; j += 1) {
          hessian[i][j] += lambda * z[i] * z[j];
        }
      }
    }
    const slopePrecision = 1 / settings.slopePriorSd ** 2;
    gradient[1] -= (theta[1] - settings.slopePriorMean) * slopePrecision;
    hessian[1][1] += slopePrecision;
    if (usePatterns) {
      const patternPrecision = 1 / Math.max(1e-9, settings.patternPriorSd) ** 2;
      for (let i = 2; i < size; i += 1) {
        gradient[i] -= theta[i] * patternPrecision;
        hessian[i][i] += patternPrecision;
      }
    }
    const step = solveLinearSystem(
      hessian.map((row) => [...row]),
      gradient
    );
    if (!step) break;
    let change = 0;
    for (let i = 0; i < size; i += 1) {
      theta[i] += step[i];
      change += Math.abs(step[i]);
    }
    if (change < 1e-10) break;
  }
  const stdErrors = Array.from({ length: size }, (_, index) => {
    const unit = Array.from({ length: size }, (_, i) => (i === index ? 1 : 0));
    const column = solveLinearSystem(
      hessian.map((row) => [...row]),
      unit
    );
    return column ? Math.sqrt(Math.max(0, column[index])) : Number.NaN;
  });
  return { theta, stdErrors, logLikelihood: poissonLogLikelihood(rows, theta, usePatterns) };
}

function poissonLogLikelihood(rows: CalibrationRow[], theta: number[], usePatterns: boolean): number {
  return rows.reduce((sum, row) => sum + rowLogLikelihood(row, theta, row.x, usePatterns), 0);
}

function rowLogLikelihood(row: CalibrationRow, theta: number[], x: number, usePatterns: boolean): number {
  const eta =
    row.offset +
    theta[0] +
    theta[1] * x +
    (usePatterns ? row.patterns.reduce((sum, value, i) => sum + value * (theta[2 + i] ?? 0), 0) : 0);
  return row.w * eta - Math.exp(eta) - logFactorial(row.w);
}

type DatedCalibrationRow = CalibrationRow & { drawNumber: number };

function calibrationRows(game: GameType, history: Draw[], predicted: Map<number, number>): DatedCalibrationRow[] {
  const spec = GAME_SPECS[game];
  const volumes = estimateTicketVolumes(game, history);
  const total = combinations(spec.maxNumber, spec.mainCount);
  const rows: DatedCalibrationRow[] = [];
  for (const draw of history) {
    const x = predicted.get(draw.drawNumber);
    const volume = volumes.get(draw.drawNumber);
    const winners = draw.prizeTiers.find((prize) => prize.tier === 1)?.winners;
    if (x === undefined || !volume || winners === null || winners === undefined) continue;
    rows.push({
      drawNumber: draw.drawNumber,
      offset: Math.log(volume / total),
      x,
      patterns: combinationPatternFeatures(game, draw.mainNumbers),
      w: winners
    });
  }
  return rows;
}

function walkForSettings(game: GameType, history: Draw[], settings: CalibrationSettings): WalkForwardResult {
  return walkForwardPopularity(game, history, {
    trainTiers: settings.trainTiers,
    evalTier: settings.trainTiers[settings.trainTiers.length - 1],
    ridge: settings.ridge,
    patterns: false,
    warmup: settings.warmup,
    refitEvery: settings.refitEvery
  });
}

/**
 * 本番用の較正済み人気度モデル。
 * 1. 低位等級の口数から γ をウォークフォワードで推定し、各回の Σγ を標本外で予測する。
 * 2. その標本外予測で 1等口数を Poisson 回帰し、換算の傾き s と並びのクセ δ を決める。
 * 履歴は引数で渡された分だけを使い、未来の回は参照しない。
 */
export function fitCalibratedPopularity(game: GameType, history: Draw[], settings: CalibrationSettings): CalibratedPopularity | null {
  if (history.length <= settings.warmup) {
    return null;
  }
  const walk = walkForSettings(game, history, settings);
  if (walk.finalGamma.size === 0) {
    return null;
  }
  const rows = calibrationRows(game, history, walk.predictedLogPopularity);
  const usePatterns = settings.patternPriorSd > 0;
  const base = {
    game,
    gamma: walk.finalGamma,
    calibrationDraws: rows.length,
    calibrationWinners: rows.reduce((sum, row) => sum + row.w, 0),
    trainedThroughDraw: history.at(-1)?.drawNumber ?? 0
  };
  if (rows.length < settings.minCalibrationDraws) {
    return {
      ...base,
      intercept: 0,
      slope: settings.slopePriorMean,
      slopeStdError: settings.slopePriorSd,
      patternCoefficients: PATTERN_FEATURE_NAMES.map(() => 0),
      patternStdErrors: PATTERN_FEATURE_NAMES.map(() => settings.patternPriorSd)
    };
  }
  const fit = fitPenalizedJackpotPoisson(rows, settings, usePatterns);
  return {
    ...base,
    intercept: fit.theta[0],
    slope: fit.theta[1],
    slopeStdError: fit.stdErrors[1],
    patternCoefficients: PATTERN_FEATURE_NAMES.map((_, index) => (usePatterns ? fit.theta[2 + index] : 0)),
    patternStdErrors: PATTERN_FEATURE_NAMES.map((_, index) => (usePatterns ? fit.stdErrors[2 + index] : 0))
  };
}

/** 較正済みモデルで見た、組み合わせの 1等での相対的な買われやすさの対数 (平均的な口 ≈ 0)。 */
export function calibratedLogPopularity(model: CalibratedPopularity, numbers: number[]): number {
  const linear = numbers.reduce((sum, number) => sum + (model.gamma.get(number) ?? 0), 0);
  const patterns = combinationPatternFeatures(model.game, numbers);
  return (
    model.intercept +
    model.slope * linear +
    patterns.reduce((sum, value, index) => sum + value * (model.patternCoefficients[index] ?? 0), 0)
  );
}

export type NestedValidationRow = {
  label: string;
  /** 帰無モデル (人気差なし) に対する標本外対数尤度の改善。 */
  deltaLogLikelihood: number;
  perDraw: number;
};

/**
 * 較正そのものも標本外で評価する入れ子のウォークフォワード。
 * 回 t の 1等口数を、t より前だけで決めた γ・s・δ で予測し、対数尤度を積み上げる。
 */
export function nestedJackpotValidation(
  game: GameType,
  history: Draw[],
  settings: CalibrationSettings,
  options: { evalStart: number; refitEvery: number; extraPredictors?: Record<string, Map<number, number>> }
): { evaluatedDraws: number; evaluatedWinners: number; rows: NestedValidationRow[] } {
  const walk = walkForSettings(game, history, settings);
  const rows = calibrationRows(game, history, walk.predictedLogPopularity);
  const positionOf = new Map(history.map((draw, index) => [draw.drawNumber, index]));
  type Variant = {
    label: string;
    x: (row: DatedCalibrationRow) => number;
    mode: "null" | "fixed" | "calibrated";
    patterns: boolean;
  };
  const variants: Variant[] = [
    { label: "人気差なし (帰無)", x: () => 0, mode: "null", patterns: false },
    { label: "理論換算 s=1 固定", x: (row) => row.x, mode: "fixed", patterns: false },
    { label: "較正 s (並びのクセなし)", x: (row) => row.x, mode: "calibrated", patterns: false },
    { label: "較正 s + 並びのクセ δ", x: (row) => row.x, mode: "calibrated", patterns: true }
  ];
  for (const [label, predictor] of Object.entries(options.extraPredictors ?? {})) {
    variants.push({ label, x: (row) => predictor.get(row.drawNumber) ?? 0, mode: "fixed", patterns: false });
  }
  const totals = variants.map(() => 0);
  let evaluatedDraws = 0;
  let evaluatedWinners = 0;
  let thetas: number[][] = variants.map(() => [0, 1]);
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    const position = positionOf.get(row.drawNumber) ?? 0;
    if (position < options.evalStart) continue;
    if (evaluatedDraws % options.refitEvery === 0) {
      const past = rows.slice(0, r);
      thetas = variants.map((variant) => {
        const mapped = past.map((item) => ({ ...item, x: variant.x(item) }));
        if (variant.mode === "calibrated") {
          return fitPenalizedJackpotPoisson(mapped, settings, variant.patterns).theta;
        }
        // 切片だけを学習し、傾きは 0 (帰無) か 1 (理論値) に固定する。
        const slope = variant.mode === "null" ? 0 : 1;
        const shifted = mapped.map((item) => ({ ...item, offset: item.offset + slope * item.x, x: 0 }));
        const fit = fitPenalizedJackpotPoisson(shifted, { slopePriorMean: 0, slopePriorSd: 1e-6, patternPriorSd: 0 }, false);
        return [fit.theta[0], slope];
      });
    }
    variants.forEach((variant, index) => {
      totals[index] += rowLogLikelihood(row, thetas[index], variant.x(row), variant.patterns);
    });
    evaluatedDraws += 1;
    evaluatedWinners += row.w;
  }
  const nullTotal = totals[0];
  return {
    evaluatedDraws,
    evaluatedWinners,
    rows: variants.map((variant, index) => ({
      label: variant.label,
      deltaLogLikelihood: totals[index] - nullTotal,
      perDraw: evaluatedDraws > 0 ? (totals[index] - nullTotal) / evaluatedDraws : 0
    }))
  };
}

// ---------------------------------------------------------------------------
// 全等級の期待払戻
// ---------------------------------------------------------------------------

export type PrizeBaseline = {
  tier: number;
  matches: number;
  probability: number;
  /** 1等は「その回の1等の総額 (賞金 × 口数)」、2等以下は1口あたり賞金の中央値。 */
  baselineYen: number;
  /** 当せん口数で山分けされる等級か (ロト6の5等は固定1,000円)。 */
  pariMutuel: boolean;
  coefficient: number;
};

/** 直近 window 回の賞金から等級ごとの基準額を作る。1等が出た回が無ければ全履歴から取る。 */
export function buildPrizeBaselines(game: GameType, history: Draw[], window: number): PrizeBaseline[] {
  const recent = history.slice(-window);
  return TIER_DEFINITIONS[game].map((definition) => {
    const pick = (draws: Draw[]) =>
      draws
        .map((draw) => draw.prizeTiers.find((prize) => prize.tier === definition.tier))
        .filter((prize): prize is NonNullable<typeof prize> => Boolean(prize && prize.winners && prize.winners > 0 && prize.prizeYen))
        .map((prize) => (definition.tier === 1 ? (prize.prizeYen ?? 0) * (prize.winners ?? 0) : (prize.prizeYen ?? 0)));
    const values = pick(recent).length > 0 ? pick(recent) : pick(history);
    return {
      tier: definition.tier,
      matches: definition.matches,
      probability: tierProbability(game, definition),
      baselineYen: values.length > 0 ? medianOf(values) : 0,
      pariMutuel: !(game === "loto6" && definition.tier === 5),
      coefficient: tierPopularityCoefficient(game, definition.matches)
    };
  });
}

export type ExpectedReturn = {
  /** 平均的な買い方に対する、この組み合わせの 1等での相対的な買われやすさ。 */
  relativePopularity: number;
  /** 1等当せん時に自分以外に同じ組み合わせを持つ人数の期待値。 */
  expectedCoWinners: number;
  /** E[1 / (1 + 同時当せん者数)]。独占できた場合を 1 とする。 */
  payoutFactor: number;
  /** 1口あたりの期待払戻額 (円)。当せん確率は組み合わせによらず一定なので、差は受取額の見込みだけから生まれる。 */
  expectedReturnYen: number;
  /** 期待払戻 ÷ 購入額。どの組み合わせでも 1 を大きく下回る。 */
  returnRatio: number;
};

/**
 * 1口あたりの期待払戻。
 * E[払戻] = Σ_k P_k · E[賞金_k | k等に当せん]。
 * - 1等:  総額 × E[1/(1+X)], X ~ Poisson(N̂ q(c)), q(c) = exp(logPop(c)) / C
 * - 2等以下 (山分け): 基準額 × exp(−c_k² · s · Σγ_c)
 *   自分が k 個一致したとき、当せん数字の人気の和の条件付き期待値は c_k · Σγ_c で、
 *   その等級の口数はさらに c_k 倍の感度でそれに反応する (一次近似)。
 */
export function expectedReturnForCombination(
  game: GameType,
  numbers: number[],
  model: CalibratedPopularity,
  baselines: PrizeBaseline[],
  ticketVolume: number
): ExpectedReturn {
  const spec = GAME_SPECS[game];
  const logPopularity = calibratedLogPopularity(model, numbers);
  const linear = model.slope * numbers.reduce((sum, number) => sum + (model.gamma.get(number) ?? 0), 0);
  const relativePopularity = Math.exp(logPopularity);
  const m = (Math.max(0, ticketVolume) * relativePopularity) / combinations(spec.maxNumber, spec.mainCount);
  const payoutFactor = m > 1e-9 ? (1 - Math.exp(-m)) / m : 1;
  const expectedReturnYen = baselines.reduce((sum, baseline) => {
    if (baseline.tier === 1) {
      return sum + baseline.probability * baseline.baselineYen * payoutFactor;
    }
    const multiplier = baseline.pariMutuel ? Math.exp(-(baseline.coefficient ** 2) * linear) : 1;
    return sum + baseline.probability * baseline.baselineYen * multiplier;
  }, 0);
  return {
    relativePopularity,
    expectedCoWinners: m,
    payoutFactor,
    expectedReturnYen,
    returnRatio: expectedReturnYen / spec.ticketPriceYen
  };
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
