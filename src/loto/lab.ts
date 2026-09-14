import { GAME_SPECS } from "./constants";
import { combinations, regularizedLowerGamma, shrinkFrequencies } from "./mathCore";
import { createSeededRandom, shuffleWithRandom } from "./random";
import type { Draw, GameType } from "./types";

/**
 * 実験ラボ。
 *
 * 「次回の数字を考える角度」を数十個並べ、すべてを同じウォークフォワード条件で採点する。
 * 角度 (Angle) は「履歴だけから各数字にスコアを付ける関数」で、未来の抽せんは一切参照しない。
 *
 * 採点は 2 軸:
 *   AUC        : その角度のスコア順位で、実際の本数字 7 個が非本数字 30 個より上に来る割合 (帰無 0.5)。
 *                Mann–Whitney 統計量なので、上位 7 個だけでなく全順位を使う分だけ検出力が高い。
 *   top7 一致数 : スコア上位 7 個をそのまま買った場合の一致数 (帰無 7×7/37 = 1.324)。
 *
 * 帰無分布は解析的に求まる (順位統計の分散, 超幾何分布) ので z 値と p 値を出し、
 * 角度の数だけ多重比較になるため Benjamini–Hochberg で補正する。
 * さらに抽せん順序をシャッフルした並べ替え検定で「時間的な構造」だけを分離して検証する。
 */

export type AngleScorer = (state: LabState, ctx: StepContext) => number[];

export type Angle = {
  id: string;
  family: string;
  description: string;
  score: AngleScorer;
};

export type StepContext = {
  /** 直前抽せん (履歴の最後) */
  previous: Draw | undefined;
  /** 予測対象のインデックス (= 履歴長) */
  index: number;
  random: () => number;
};

/** 履歴を 1 回ずつ取り込んで更新する統計状態。全角度がここから読む。 */
export class LabState {
  readonly game: GameType;
  readonly max: number;
  readonly k: number;
  readonly count: Float64Array;
  /** cumulative[t][n] = 先頭から t 回までに n が出た回数 (t = 0 は空) */
  readonly cumulative: Float64Array[] = [];
  readonly lastSeen: Int32Array;
  readonly gapSum: Float64Array;
  readonly gapCount: Float64Array;
  readonly streak: Int32Array;
  readonly ewma: Map<number, Float64Array> = new Map();
  readonly cooc: Float64Array;
  readonly trans: Float64Array;
  readonly transBase: Float64Array;
  sumTotal = 0;
  history: Draw[] = [];

  constructor(game: GameType, halfLives: number[]) {
    this.game = game;
    this.max = GAME_SPECS[game].maxNumber;
    this.k = GAME_SPECS[game].mainCount;
    const size = this.max + 1;
    this.count = new Float64Array(size);
    this.lastSeen = new Int32Array(size).fill(-1);
    this.gapSum = new Float64Array(size);
    this.gapCount = new Float64Array(size);
    this.streak = new Int32Array(size);
    this.cooc = new Float64Array(size * size);
    this.trans = new Float64Array(size * size);
    this.transBase = new Float64Array(size);
    this.cumulative.push(new Float64Array(size));
    for (const halfLife of halfLives) {
      this.ewma.set(halfLife, new Float64Array(size));
    }
  }

  get length(): number {
    return this.history.length;
  }

  push(draw: Draw): void {
    const t = this.history.length;
    const previous = this.history.at(-1);
    const inDraw = new Uint8Array(this.max + 1);
    for (const n of draw.mainNumbers) inDraw[n] = 1;

    for (let n = 1; n <= this.max; n += 1) {
      if (inDraw[n]) {
        if (this.lastSeen[n] >= 0) {
          this.gapSum[n] += t - this.lastSeen[n];
          this.gapCount[n] += 1;
        }
        this.lastSeen[n] = t;
        this.count[n] += 1;
        this.streak[n] += 1;
      } else {
        this.streak[n] = 0;
      }
      for (const [halfLife, series] of this.ewma) {
        const decay = Math.pow(0.5, 1 / halfLife);
        series[n] = series[n] * decay + (inDraw[n] ? 1 : 0);
      }
    }
    const cumulative = new Float64Array(this.count);
    this.cumulative.push(cumulative);

    for (const a of draw.mainNumbers) {
      for (const b of draw.mainNumbers) {
        if (a !== b) this.cooc[a * (this.max + 1) + b] += 1;
      }
    }
    if (previous) {
      for (const j of previous.mainNumbers) {
        this.transBase[j] += 1;
        for (const n of draw.mainNumbers) {
          this.trans[j * (this.max + 1) + n] += 1;
        }
      }
    }
    this.sumTotal += draw.mainNumbers.reduce((s, n) => s + n, 0);
    this.history.push(draw);
  }

  windowCount(window: number): Float64Array {
    const t = this.length;
    const from = Math.max(0, t - window);
    const result = new Float64Array(this.max + 1);
    const late = this.cumulative[t];
    const early = this.cumulative[from];
    for (let n = 1; n <= this.max; n += 1) result[n] = late[n] - early[n];
    return result;
  }

  currentGap(n: number): number {
    return this.lastSeen[n] >= 0 ? this.length - 1 - this.lastSeen[n] : this.length;
  }

  averageGap(n: number): number {
    return this.gapCount[n] > 0 ? this.gapSum[n] / this.gapCount[n] : this.max / this.k;
  }
}

// ---------------------------------------------------------------------------
// 角度の定義
// ---------------------------------------------------------------------------

const WINDOWS = [10, 20, 30, 50, 100, 200];
const HALF_LIVES = [5, 10, 20, 50];
const RANDOM_CONTROLS = 20;

function scoresFrom(state: LabState, fn: (n: number) => number): number[] {
  const scores = new Array<number>(state.max + 1).fill(0);
  for (let n = 1; n <= state.max; n += 1) scores[n] = fn(n);
  return scores;
}

function negate(scores: number[]): number[] {
  return scores.map((v) => -v);
}

export function buildAngles(game: GameType): Angle[] {
  const spec = GAME_SPECS[game];
  const angles: Angle[] = [];
  const add = (id: string, family: string, description: string, score: AngleScorer) =>
    angles.push({ id, family, description, score });

  add("hot_all", "frequency", "全期間の出現回数が多い数字", (s) => scoresFrom(s, (n) => s.count[n]));
  add("cold_all", "frequency", "全期間の出現回数が少ない数字", (s) => negate(scoresFrom(s, (n) => s.count[n])));
  for (const w of WINDOWS) {
    add(`hot_${w}`, "frequency", `直近 ${w} 回で多く出た数字`, (s) => {
      const c = s.windowCount(w);
      return scoresFrom(s, (n) => c[n]);
    });
    add(`cold_${w}`, "frequency", `直近 ${w} 回で少なかった数字`, (s) => {
      const c = s.windowCount(w);
      return negate(scoresFrom(s, (n) => c[n]));
    });
  }
  for (const h of HALF_LIVES) {
    add(`ewma_hot_${h}`, "frequency", `半減期 ${h} 回の指数加重で最近よく出た数字`, (s) =>
      scoresFrom(s, (n) => s.ewma.get(h)![n])
    );
    add(`ewma_cold_${h}`, "frequency", `半減期 ${h} 回の指数加重で最近出ていない数字`, (s) =>
      negate(scoresFrom(s, (n) => s.ewma.get(h)![n]))
    );
  }
  add("shrink_posterior", "frequency", "カイ二乗で説明できない偏りだけ残した事後確率", (s) => {
    const counts = new Map<number, number>();
    for (let n = 1; n <= s.max; n += 1) counts.set(n, s.count[n]);
    const posterior = shrinkFrequencies(counts, s.game, s.length).posterior;
    return scoresFrom(s, (n) => posterior.get(n) ?? 0);
  });

  add("overdue_gap", "gap", "最後に出てからの間隔が長い数字", (s) => scoresFrom(s, (n) => s.currentGap(n)));
  add("fresh_gap", "gap", "最近出たばかりの数字", (s) => negate(scoresFrom(s, (n) => s.currentGap(n))));
  add("due_ratio", "gap", "現在の間隔 ÷ 平均間隔が大きい数字", (s) =>
    scoresFrom(s, (n) => s.currentGap(n) / Math.max(1, s.averageGap(n)))
  );
  add("streak_ride", "gap", "連続出現が続いている数字", (s) => scoresFrom(s, (n) => s.streak[n]));

  add("repeat_prev", "previous", "直前回の本数字", (s, ctx) =>
    scoresFrom(s, (n) => (ctx.previous?.mainNumbers.includes(n) ? 1 : 0))
  );
  add("avoid_prev", "previous", "直前回の本数字を避ける", (s, ctx) =>
    scoresFrom(s, (n) => (ctx.previous?.mainNumbers.includes(n) ? -1 : 0))
  );
  add("bonus_promote", "previous", "直前回のボーナス数字", (s, ctx) =>
    scoresFrom(s, (n) => (ctx.previous?.bonusNumbers.includes(n) ? 1 : 0))
  );
  add("neighbor_prev", "previous", "直前回の本数字の ±1", (s, ctx) =>
    scoresFrom(s, (n) => (ctx.previous?.mainNumbers.some((m) => Math.abs(m - n) === 1) ? 1 : 0))
  );
  add("markov_lift", "transition", "直前回の数字からの遷移頻度 (期待比)", (s, ctx) =>
    scoresFrom(s, (n) => {
      if (!ctx.previous) return 0;
      const base = s.length > 0 ? s.count[n] / s.length : spec.mainCount / spec.maxNumber;
      let lift = 0;
      for (const j of ctx.previous.mainNumbers) {
        const denominator = s.transBase[j];
        if (denominator > 0) lift += s.trans[j * (s.max + 1) + n] / denominator - base;
      }
      return lift;
    })
  );
  add("pair_affinity", "transition", "直前回の数字と同時に出やすかった数字", (s, ctx) =>
    scoresFrom(s, (n) => {
      if (!ctx.previous) return 0;
      let total = 0;
      for (const j of ctx.previous.mainNumbers) total += s.cooc[j * (s.max + 1) + n];
      return total;
    })
  );

  add("momentum_30", "regime", "直近 30 回の頻度が長期より高い数字", (s) => {
    const c = s.windowCount(30);
    return scoresFrom(s, (n) => c[n] / Math.min(30, Math.max(1, s.length)) - s.count[n] / Math.max(1, s.length));
  });
  add("mean_revert_30", "regime", "直近 30 回の頻度が長期より低い数字 (平均回帰)", (s) => {
    const c = s.windowCount(30);
    return negate(scoresFrom(s, (n) => c[n] / Math.min(30, Math.max(1, s.length)) - s.count[n] / Math.max(1, s.length)));
  });

  add("sum_regress", "structure", "直前回の合計が高ければ小さい数字、低ければ大きい数字", (s, ctx) => {
    if (!ctx.previous || s.length === 0) return scoresFrom(s, () => 0);
    const meanSum = s.sumTotal / s.length;
    const prevSum = ctx.previous.mainNumbers.reduce((a, b) => a + b, 0);
    const center = (s.max + 1) / 2;
    return scoresFrom(s, (n) => (meanSum - prevSum) * (n - center));
  });
  add("decade_balance", "structure", "直近 30 回で出現が少ない十の位", (s) => {
    const c = s.windowCount(30);
    const decade = new Map<number, number>();
    for (let n = 1; n <= s.max; n += 1) decade.set(Math.floor(n / 10), (decade.get(Math.floor(n / 10)) ?? 0) + c[n]);
    return scoresFrom(s, (n) => -(decade.get(Math.floor(n / 10)) ?? 0));
  });
  add("last_digit_balance", "structure", "直近 30 回で出現が少ない一の位", (s) => {
    const c = s.windowCount(30);
    const digit = new Map<number, number>();
    for (let n = 1; n <= s.max; n += 1) digit.set(n % 10, (digit.get(n % 10) ?? 0) + c[n]);
    return scoresFrom(s, (n) => -(digit.get(n % 10) ?? 0));
  });
  add("parity_balance", "structure", "直近 30 回で少なかった奇数/偶数", (s) => {
    const c = s.windowCount(30);
    let odd = 0;
    let even = 0;
    for (let n = 1; n <= s.max; n += 1) (n % 2 ? (odd += c[n]) : (even += c[n]));
    return scoresFrom(s, (n) => (n % 2 ? -odd : -even));
  });
  add("low_high_swing", "structure", "直前回が小さい数字寄りなら大きい数字を優先", (s, ctx) => {
    if (!ctx.previous) return scoresFrom(s, () => 0);
    const center = (s.max + 1) / 2;
    const bias = ctx.previous.mainNumbers.reduce((a, b) => a + (b - center), 0);
    return scoresFrom(s, (n) => -bias * (n - center));
  });

  for (let i = 1; i <= RANDOM_CONTROLS; i += 1) {
    add(`random_${i}`, "control", `純粋乱数 (対照 ${i})`, (s, ctx) => scoresFrom(s, () => ctx.random()));
  }
  return angles;
}

// ---------------------------------------------------------------------------
// 評価
// ---------------------------------------------------------------------------

export type AngleResult = {
  id: string;
  family: string;
  description: string;
  trials: number;
  meanAuc: number;
  aucZ: number;
  aucP: number;
  aucQ: number;
  meanTop7: number;
  top7Z: number;
  top7P: number;
  top10Hit: number;
  top15Hit: number;
  top20Hit: number;
  firstHalfAuc: number;
  secondHalfAuc: number;
  consistent: boolean;
  permutationP: number | null;
  /** 直近の履歴に対するスコア (次回予想用)。index = 数字。 */
  latestScores: number[];
};

export type LabRun = {
  game: GameType;
  drawsUsed: number;
  minTrainingDraws: number;
  trials: number;
  angles: AngleResult[];
  controlAucZ: { mean: number; std: number; min: number; max: number };
  permutations: number;
  nullAucStd: number;
  nullTop7Mean: number;
  nullTop7Std: number;
};

type Accumulator = { auc: number[]; top7: number[]; top10: number; top15: number; top20: number };

function midRankAuc(scores: number[], actual: number[], max: number): number {
  const items: Array<{ n: number; s: number }> = [];
  for (let n = 1; n <= max; n += 1) items.push({ n, s: scores[n] });
  items.sort((a, b) => a.s - b.s);
  const rank = new Float64Array(max + 1);
  let i = 0;
  while (i < items.length) {
    let j = i;
    while (j + 1 < items.length && items[j + 1].s === items[i].s) j += 1;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) rank[items[k].n] = avg;
    i = j + 1;
  }
  const n1 = actual.length;
  const n2 = max - n1;
  const rankSum = actual.reduce((s, n) => s + rank[n], 0);
  const u = rankSum - (n1 * (n1 + 1)) / 2;
  return u / (n1 * n2);
}

function topK(scores: number[], max: number, k: number, random: () => number): number[] {
  const items: Array<{ n: number; s: number; tie: number }> = [];
  for (let n = 1; n <= max; n += 1) items.push({ n, s: scores[n], tie: random() });
  items.sort((a, b) => b.s - a.s || a.tie - b.tie);
  return items.slice(0, k).map((item) => item.n);
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return sign * y;
}

function twoSidedP(z: number): number {
  return 2 * (1 - normalCdf(Math.abs(z)));
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function std(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/** Benjamini–Hochberg の q 値。 */
export function benjaminiHochberg(pValues: number[]): number[] {
  const m = pValues.length;
  const order = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const q = new Array<number>(m).fill(1);
  let running = 1;
  for (let rank = m; rank >= 1; rank -= 1) {
    const { p, i } = order[rank - 1];
    running = Math.min(running, (p * m) / rank);
    q[i] = running;
  }
  return q;
}

/** 超幾何分布 (母集団 max, 成功 k, 抽出 k) の平均と標準偏差。 */
export function hypergeometricMoments(game: GameType): { mean: number; std: number } {
  const { maxNumber: N, mainCount: k } = GAME_SPECS[game];
  const m = (k * k) / N;
  const variance = ((k * k) / N) * ((N - k) / N) * ((N - k) / (N - 1));
  return { mean: m, std: Math.sqrt(variance) };
}

function evaluatePass(
  draws: Draw[],
  game: GameType,
  angles: Angle[],
  minTrainingDraws: number,
  seed: number
): { acc: Accumulator[]; latest: number[][]; trials: number } {
  const state = new LabState(game, HALF_LIVES);
  const acc: Accumulator[] = angles.map(() => ({ auc: [], top7: [], top10: 0, top15: 0, top20: 0 }));
  const random = createSeededRandom(seed);
  let trials = 0;
  for (let index = 0; index < draws.length; index += 1) {
    if (index >= minTrainingDraws) {
      const actual = draws[index];
      const ctx: StepContext = { previous: state.history.at(-1), index, random };
      angles.forEach((angle, a) => {
        const scores = angle.score(state, ctx);
        acc[a].auc.push(midRankAuc(scores, actual.mainNumbers, state.max));
        const top20 = topK(scores, state.max, 20, random);
        const hits = (k: number) => top20.slice(0, k).filter((n) => actual.mainNumbers.includes(n)).length;
        acc[a].top7.push(hits(7));
        acc[a].top10 += hits(10);
        acc[a].top15 += hits(15);
        acc[a].top20 += hits(20);
      });
      trials += 1;
    }
    state.push(draws[index]);
  }
  const ctx: StepContext = { previous: state.history.at(-1), index: draws.length, random };
  const latest = angles.map((angle) => angle.score(state, ctx));
  return { acc, latest, trials };
}

export function runLab(
  draws: Draw[],
  game: GameType,
  options: { minTrainingDraws?: number; permutations?: number; seed?: number } = {}
): LabRun {
  const gameDraws = draws.filter((d) => d.game === game).sort((a, b) => a.drawNumber - b.drawNumber);
  const spec = GAME_SPECS[game];
  const minTrainingDraws = options.minTrainingDraws ?? 100;
  const permutations = options.permutations ?? 100;
  const seed = options.seed ?? 20260914;
  const angles = buildAngles(game);

  const { acc, latest, trials } = evaluatePass(gameDraws, game, angles, minTrainingDraws, seed);

  const n1 = spec.mainCount;
  const n2 = spec.maxNumber - n1;
  const nullAucStd = Math.sqrt((n1 + n2 + 1) / (12 * n1 * n2) / trials);
  const hyper = hypergeometricMoments(game);

  // 並べ替え検定: 抽せん順序をシャッフルして同じ評価を繰り返す。
  const permAuc: number[][] = angles.map(() => []);
  const permRandom = createSeededRandom(seed + 1);
  for (let p = 0; p < permutations; p += 1) {
    const shuffled = shuffleWithRandom(gameDraws, permRandom);
    const pass = evaluatePass(shuffled, game, angles, minTrainingDraws, seed + 1000 + p);
    pass.acc.forEach((a, i) => permAuc[i].push(mean(a.auc)));
  }

  const rawP: number[] = [];
  const partial = angles.map((angle, i) => {
    const a = acc[i];
    const meanAuc = mean(a.auc);
    const aucZ = (meanAuc - 0.5) / nullAucStd;
    const aucP = twoSidedP(aucZ);
    rawP.push(aucP);
    const meanTop7 = mean(a.top7);
    const top7Z = (meanTop7 - hyper.mean) / (hyper.std / Math.sqrt(trials));
    const half = Math.floor(a.auc.length / 2);
    const firstHalfAuc = mean(a.auc.slice(0, half));
    const secondHalfAuc = mean(a.auc.slice(half));
    const observedShift = Math.abs(meanAuc - 0.5);
    const permutationP =
      permutations > 0 ? permAuc[i].filter((v) => Math.abs(v - 0.5) >= observedShift).length / permutations : null;
    return {
      id: angle.id,
      family: angle.family,
      description: angle.description,
      trials,
      meanAuc,
      aucZ,
      aucP,
      meanTop7,
      top7Z,
      top7P: twoSidedP(top7Z),
      top10Hit: a.top10 / trials,
      top15Hit: a.top15 / trials,
      top20Hit: a.top20 / trials,
      firstHalfAuc,
      secondHalfAuc,
      consistent: Math.sign(firstHalfAuc - 0.5) === Math.sign(secondHalfAuc - 0.5) && firstHalfAuc !== 0.5,
      permutationP,
      latestScores: latest[i]
    };
  });
  const q = benjaminiHochberg(rawP);
  const results: AngleResult[] = partial.map((r, i) => ({ ...r, aucQ: q[i] }));
  const controls = results.filter((r) => r.family === "control").map((r) => r.aucZ);

  return {
    game,
    drawsUsed: gameDraws.length,
    minTrainingDraws,
    trials,
    angles: results,
    controlAucZ: { mean: mean(controls), std: std(controls), min: Math.min(...controls), max: Math.max(...controls) },
    permutations,
    nullAucStd,
    nullTop7Mean: hyper.mean,
    nullTop7Std: hyper.std / Math.sqrt(trials)
  };
}

// ---------------------------------------------------------------------------
// 組み合わせ構造の検証 (合計・奇偶・連番など)
// ---------------------------------------------------------------------------

export type StructureCheck = {
  id: string;
  description: string;
  observedMean: number;
  theoreticalMean: number;
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  observedBins: Record<string, number>;
  expectedBins: Record<string, number>;
};

type StructureFeature = { id: string; description: string; value: (numbers: number[]) => number; bins: number[] };

function structureFeatures(game: GameType): StructureFeature[] {
  const spec = GAME_SPECS[game];
  const third = Math.ceil(spec.maxNumber / 3);
  return [
    {
      id: "sum",
      description: "本数字の合計",
      value: (ns) => ns.reduce((a, b) => a + b, 0),
      bins: [90, 105, 115, 125, 135, 145, 155, 165, 180]
    },
    { id: "odd_count", description: "奇数の個数", value: (ns) => ns.filter((n) => n % 2 === 1).length, bins: [1.5, 2.5, 3.5, 4.5, 5.5] },
    {
      id: "consecutive_pairs",
      description: "連番ペアの数",
      value: (ns) => {
        const s = [...ns].sort((a, b) => a - b);
        return s.filter((n, i) => i > 0 && n - s[i - 1] === 1).length;
      },
      bins: [0.5, 1.5, 2.5]
    },
    { id: "low_count", description: `小さい数字 (1-${third}) の個数`, value: (ns) => ns.filter((n) => n <= third).length, bins: [0.5, 1.5, 2.5, 3.5, 4.5] },
    { id: "span", description: "最大 − 最小", value: (ns) => Math.max(...ns) - Math.min(...ns), bins: [22, 26, 29, 31, 33, 35] },
    {
      id: "same_last_digit",
      description: "一の位が重複する数字の数",
      value: (ns) => {
        const c = new Map<number, number>();
        for (const n of ns) c.set(n % 10, (c.get(n % 10) ?? 0) + 1);
        return [...c.values()].filter((v) => v > 1).reduce((a, b) => a + b, 0);
      },
      bins: [0.5, 2.5, 3.5, 4.5]
    }
  ];
}

function binIndex(value: number, bins: number[]): number {
  let i = 0;
  while (i < bins.length && value > bins[i]) i += 1;
  return i;
}

export function runStructureChecks(draws: Draw[], game: GameType, samples = 40000, seed = 99): StructureCheck[] {
  const spec = GAME_SPECS[game];
  const gameDraws = draws.filter((d) => d.game === game);
  const random = createSeededRandom(seed);
  const features = structureFeatures(game);
  const simulated: number[][] = features.map(() => []);
  const domain = Array.from({ length: spec.maxNumber }, (_, i) => i + 1);
  for (let s = 0; s < samples; s += 1) {
    const pick = shuffleWithRandom(domain, random).slice(0, spec.mainCount);
    features.forEach((f, i) => simulated[i].push(f.value(pick)));
  }
  return features.map((f, i) => {
    const observed = gameDraws.map((d) => f.value(d.mainNumbers));
    const binCount = f.bins.length + 1;
    const obsBins = new Array<number>(binCount).fill(0);
    const simBins = new Array<number>(binCount).fill(0);
    for (const v of observed) obsBins[binIndex(v, f.bins)] += 1;
    for (const v of simulated[i]) simBins[binIndex(v, f.bins)] += 1;
    const expected = simBins.map((c) => (c / samples) * observed.length);
    let chi = 0;
    let df = -1;
    const observedBins: Record<string, number> = {};
    const expectedBins: Record<string, number> = {};
    for (let b = 0; b < binCount; b += 1) {
      const label = b === 0 ? `≤${f.bins[0]}` : b === binCount - 1 ? `>${f.bins[b - 1]}` : `${f.bins[b - 1]}<x≤${f.bins[b]}`;
      observedBins[label] = obsBins[b];
      expectedBins[label] = Math.round(expected[b] * 10) / 10;
      if (expected[b] > 0) {
        chi += (obsBins[b] - expected[b]) ** 2 / expected[b];
        df += 1;
      }
    }
    const pValue = df > 0 ? 1 - regularizedLowerGamma(df / 2, chi / 2) : 1;
    return {
      id: f.id,
      description: f.description,
      observedMean: mean(observed),
      theoreticalMean: mean(simulated[i]),
      chiSquare: chi,
      degreesOfFreedom: Math.max(0, df),
      pValue,
      observedBins,
      expectedBins
    };
  });
}

/** 1等の理論確率 (参考表示用)。 */
export function jackpotOdds(game: GameType): number {
  const spec = GAME_SPECS[game];
  return combinations(spec.maxNumber, spec.mainCount);
}
