import { GAME_SPECS, numbersForGame } from "./constants";
import type { Draw, GameType } from "./types";

/**
 * 数理コア。
 *
 * ここに置くのは「検定できる・導出できる」計算だけ。
 *
 * 1. 一様性の検定 (カイ二乗)     : 出現回数が一様抽せんと矛盾しないかを測る。
 * 2. 経験ベイズ縮小 (James-Stein) : 出現頻度の偏りを、検定で説明できる分だけ残して一様へ戻す。
 * 3. 販売口数の復元               : 固定賞金等級の当せん口数 ÷ 理論確率 で口数を推定する。
 * 4. 対数線形の人気度回帰 (Ridge) : 「人気数字を含む回ほど低位等級の口数が増える」性質から
 *                                   数字ごとの選ばれやすさ β を推定する。
 * 5. 当せん時の期待受取係数       : パリミュチュエルなので E[受取 | 当せん] ∝ 1 / (1 + 期待同時当せん者数)。
 * 6. ポートフォリオの被覆         : 複数口の 3 個組がどれだけ重ならずに散らばっているか。
 *
 * どの計算も未来の抽せん結果を参照しない。当せん確率そのものは組み合わせによらず一定で、
 * ここで差が出るのは「当せんした場合にいくら受け取れるか」の期待だけである。
 */

export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) {
    return 0;
  }
  let result = 1;
  for (let index = 1; index <= k; index += 1) {
    result = (result * (n - k + index)) / index;
  }
  return result;
}

/** 本数字 mainCount 個のうち k 個が一致する理論確率 (ボーナスは無視)。 */
export function matchProbability(game: GameType, k: number): number {
  const spec = GAME_SPECS[game];
  return (
    (combinations(spec.mainCount, k) * combinations(spec.maxNumber - spec.mainCount, spec.mainCount - k)) /
    combinations(spec.maxNumber, spec.mainCount)
  );
}

// ---------------------------------------------------------------------------
// 1. 一様性の検定
// ---------------------------------------------------------------------------

export type UniformityTest = {
  statistic: number;
  degreesOfFreedom: number;
  pValue: number;
  /** 一様抽せんと矛盾しない = true。慣例的に p >= 0.05。 */
  consistentWithUniform: boolean;
};

export function chiSquareUniformity(counts: Map<number, number>, game: GameType, drawCount: number): UniformityTest {
  const spec = GAME_SPECS[game];
  const domain = numbersForGame(game);
  const expected = (drawCount * spec.mainCount) / spec.maxNumber;
  if (expected <= 0) {
    return { statistic: 0, degreesOfFreedom: spec.maxNumber - 1, pValue: 1, consistentWithUniform: true };
  }
  const statistic = domain.reduce((sum, number) => sum + ((counts.get(number) ?? 0) - expected) ** 2 / expected, 0);
  const degreesOfFreedom = spec.maxNumber - 1;
  const pValue = 1 - regularizedLowerGamma(degreesOfFreedom / 2, statistic / 2);
  return { statistic, degreesOfFreedom, pValue, consistentWithUniform: pValue >= 0.05 };
}

/** 正則化下側不完全ガンマ関数 P(a, x)。カイ二乗分布の CDF に使う。 */
export function regularizedLowerGamma(a: number, x: number): number {
  if (x <= 0) {
    return 0;
  }
  if (x < a + 1) {
    let term = 1 / a;
    let sum = term;
    for (let n = 1; n < 500; n += 1) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-14) {
        break;
      }
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }
  // Lentz 法による連分数で上側 Q(a, x) を求める。
  let b = x + 1 - a;
  let c = 1 / 1e-300;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) {
      break;
    }
  }
  return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

function logGamma(z: number): number {
  const coefficients = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2,
    -0.5395239384953e-5
  ];
  const x = z;
  let y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let series = 1.000000000190015;
  for (const coefficient of coefficients) {
    y += 1;
    series += coefficient / y;
  }
  return -tmp + Math.log((2.5066282746310005 * series) / x);
}

// ---------------------------------------------------------------------------
// 2. 経験ベイズ縮小
// ---------------------------------------------------------------------------

export type ShrinkageEstimate = {
  /** 0 = 完全に一様へ戻す, 1 = 観測頻度をそのまま信じる */
  lambda: number;
  /** 数字ごとの事後確率 (1回の抽せんでその数字が本数字に含まれる確率) */
  posterior: Map<number, number>;
  test: UniformityTest;
};

/**
 * James-Stein 型の縮小。
 * 観測されたばらつきのうち二項分布の揺らぎで説明できる分 (自由度 / 統計量) は
 * 「実在しない偏り」として捨て、説明できない超過分だけを残す。
 * 一様抽せんならカイ二乗統計量 ≈ 自由度 なので lambda ≈ 0 になり、
 * hot / cold のような頻度シグナルは自動的に消える。
 */
export function shrinkFrequencies(counts: Map<number, number>, game: GameType, drawCount: number): ShrinkageEstimate {
  const spec = GAME_SPECS[game];
  const domain = numbersForGame(game);
  const test = chiSquareUniformity(counts, game, drawCount);
  const uniform = spec.mainCount / spec.maxNumber;
  const lambda = test.statistic > 0 ? Math.max(0, 1 - test.degreesOfFreedom / test.statistic) : 0;
  const posterior = new Map(
    domain.map((number) => {
      const observed = drawCount > 0 ? (counts.get(number) ?? 0) / drawCount : uniform;
      return [number, uniform + lambda * (observed - uniform)];
    })
  );
  return { lambda, posterior, test };
}

// ---------------------------------------------------------------------------
// 3. 販売口数の復元
// ---------------------------------------------------------------------------

/** 口数復元に使う「当せん者数が多く、賞金がほぼ固定」の等級とその一致数。 */
function volumeReferenceTier(game: GameType): { tier: number; matches: number } {
  return game === "loto6" ? { tier: 5, matches: 3 } : { tier: 5, matches: 4 };
}

/**
 * 各回の販売口数を推定する。
 * 参照等級の当せん口数 W_t ≈ N_t × p_k × (人気効果) なので、
 * 人気効果を過去 window 回の中央値で打ち消し、N_t ≈ median(W / p_k) とする。
 * 未来の回は参照しない (t 以前の window 回だけを使う)。
 */
export function estimateTicketVolumes(game: GameType, history: Draw[], window = 12): Map<number, number> {
  const { tier, matches } = volumeReferenceTier(game);
  const p = matchProbability(game, matches);
  const rawVolumes: number[] = [];
  const result = new Map<number, number>();
  for (const draw of history) {
    const winners = draw.prizeTiers.find((prize) => prize.tier === tier)?.winners ?? null;
    if (winners !== null && winners > 0) {
      rawVolumes.push(winners / p);
    }
    const recent = rawVolumes.slice(-window);
    if (recent.length > 0) {
      result.set(draw.drawNumber, median(recent));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// 4. 対数線形の人気度回帰
// ---------------------------------------------------------------------------

export type PopularityRegression = {
  /** 数字ごとの対数人気度 β。0 が平均、正なら選ばれやすい。 */
  beta: Map<number, number>;
  intercept: number;
  observations: number;
  /** 残差分散から見た説明力 (0-1)。 */
  rSquared: number;
};

/**
 * y_t = log(W_t / (N_t p_k)) を、その回の本数字の指示変数で Ridge 回帰する。
 * 「その回に人気数字が多いほど低位等級の当せん口数が理論値より多い」という
 * パリミュチュエルの性質をそのまま式にしたもの。
 */
export function fitPopularityRegression(
  game: GameType,
  history: Draw[],
  options: { ridge?: number; minObservations?: number } = {}
): PopularityRegression | null {
  const spec = GAME_SPECS[game];
  const { tier, matches } = volumeReferenceTier(game);
  const p = matchProbability(game, matches);
  const volumes = estimateTicketVolumes(game, history);
  const ridge = options.ridge ?? 4;
  const minObservations = options.minObservations ?? 30;
  const rows: Array<{ numbers: number[]; y: number }> = [];

  for (const draw of history) {
    const winners = draw.prizeTiers.find((prize) => prize.tier === tier)?.winners ?? null;
    const volume = volumes.get(draw.drawNumber);
    if (winners === null || winners <= 0 || !volume || volume <= 0) {
      continue;
    }
    rows.push({ numbers: draw.mainNumbers, y: Math.log(winners / (volume * p)) });
  }
  if (rows.length < minObservations) {
    return null;
  }

  // 各数字の指示変数は「その回に含まれれば 1」。切片を除き平均 0 に中心化して解く。
  const domain = numbersForGame(game);
  const dimension = domain.length;
  const meanY = mean(rows.map((row) => row.y));
  const meanX = spec.mainCount / spec.maxNumber;
  const xtx = Array.from({ length: dimension }, () => new Array<number>(dimension).fill(0));
  const xty = new Array<number>(dimension).fill(0);
  for (const row of rows) {
    const x = domain.map((number) => (row.numbers.includes(number) ? 1 : 0) - meanX);
    const y = row.y - meanY;
    for (let i = 0; i < dimension; i += 1) {
      xty[i] += x[i] * y;
      for (let j = 0; j < dimension; j += 1) {
        xtx[i][j] += x[i] * x[j];
      }
    }
  }
  for (let i = 0; i < dimension; i += 1) {
    xtx[i][i] += ridge;
  }
  const solution = solveLinearSystem(xtx, xty);
  if (!solution) {
    return null;
  }
  const beta = new Map(domain.map((number, index) => [number, solution[index]]));
  const residuals = rows.map((row) => {
    const predicted =
      meanY + domain.reduce((sum, number, index) => sum + ((row.numbers.includes(number) ? 1 : 0) - meanX) * solution[index], 0);
    return row.y - predicted;
  });
  const totalVariance = variance(rows.map((row) => row.y));
  const residualVariance = variance(residuals);
  return {
    beta,
    intercept: meanY,
    observations: rows.length,
    rSquared: totalVariance > 0 ? Math.max(0, 1 - residualVariance / totalVariance) : 0
  };
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] | null {
  const n = vector.length;
  const a = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) {
        pivot = row;
      }
    }
    if (Math.abs(a[pivot][column]) < 1e-12) {
      return null;
    }
    [a[column], a[pivot]] = [a[pivot], a[column]];
    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = a[row][column] / a[column][column];
      if (factor === 0) continue;
      for (let k = column; k <= n; k += 1) {
        a[row][k] -= factor * a[column][k];
      }
    }
  }
  return a.map((row, index) => row[n] / row[index]);
}

// ---------------------------------------------------------------------------
// 5. 当せん時の期待受取係数
// ---------------------------------------------------------------------------

export type PayoutExpectation = {
  /** 平均的な買い方に対する、この組み合わせが他人に買われる相対頻度 (1 = 平均) */
  relativePopularity: number;
  /** 1等当せん時に自分以外に同じ組み合わせを持つ人数の期待値 */
  expectedCoWinners: number;
  /** E[受取 | 当せん] を「独占できた場合」を 1 として表した係数 */
  payoutFactor: number;
  /** 販売口数の推定値 */
  ticketVolume: number;
};

/**
 * 1等の期待受取係数。
 * 他人の 1 口が自分と同じ組み合わせである確率は q(c) = relPop(c) / C(n, k)。
 * 販売口数 N のとき同時当せん者数は近似的に Poisson(N q) に従い、
 * E[1 / (1 + X)] = (1 - e^{-m}) / m (m = N q) が閉形式で得られる。
 */
export function expectedJackpotPayout(
  game: GameType,
  numbers: number[],
  beta: Map<number, number> | null,
  ticketVolume: number
): PayoutExpectation {
  const spec = GAME_SPECS[game];
  const logPop = beta ? numbers.reduce((sum, number) => sum + (beta.get(number) ?? 0), 0) : 0;
  const relativePopularity = Math.exp(logPop);
  const q = relativePopularity / combinations(spec.maxNumber, spec.mainCount);
  const m = Math.max(0, ticketVolume) * q;
  const payoutFactor = m > 1e-9 ? (1 - Math.exp(-m)) / m : 1;
  return { relativePopularity, expectedCoWinners: m, payoutFactor, ticketVolume };
}

// ---------------------------------------------------------------------------
// 6. ポートフォリオの被覆
// ---------------------------------------------------------------------------

/**
 * 複数口の間で 3 個組がどれだけ重複せず散らばっているか (0-1)。
 * 当せん確率の合計は口数だけで決まるが、3 個組の重なりが少ないほど
 * 下位等級の当せんが同じ回に集中せず、ポートフォリオの分散が下がる。
 */
export function tripleCoverageRatio(tickets: number[][]): number {
  if (tickets.length === 0) {
    return 1;
  }
  const seen = new Set<string>();
  let total = 0;
  for (const ticket of tickets) {
    const sorted = [...ticket].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        for (let k = j + 1; k < sorted.length; k += 1) {
          seen.add(`${sorted[i]}-${sorted[j]}-${sorted[k]}`);
          total += 1;
        }
      }
    }
  }
  return total > 0 ? seen.size / total : 1;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function variance(values: number[]): number {
  const avg = mean(values);
  return values.length ? values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length : 0;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
