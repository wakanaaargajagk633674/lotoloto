import { strategyWeights } from "@/config/strategyWeights";
import { BASE_DISCLAIMER, GAME_SPECS } from "./constants";
import { buildDisclaimer, explainTicket } from "./explanations";
import { computeNumberFeatures } from "./features";
import { createSeededRandom, shuffleWithRandom } from "./random";
import { scoreCombination, scoreNumbers } from "./scoring";
import { validateNumbers } from "./validation";
import type { CandidateTuningMode, Draw, GameType, GenerateOptions, PredictionTicket, StrategyType } from "./types";

export function generateTickets(draws: Draw[], options: GenerateOptions, sourcePatternSignals: number[] = []): PredictionTicket[] {
  const history = draws.filter((draw) => draw.game === options.game).sort((a, b) => a.drawNumber - b.drawNumber);
  if (history.length === 0) {
    throw new Error(`No draw history available for ${options.game}`);
  }
  const random = createSeededRandom(options.seed ?? 1);
  const strategies = expandStrategies(options.game, options.strategy, options.ticketCount, random);
  const tickets: PredictionTicket[] = [];
  const usedNumbers = new Map<number, number>();
  const usedPairs = new Map<string, number>();
  const usedProfiles = new Map<string, number>();

  for (let index = 0; index < options.ticketCount; index += 1) {
    const strategy = strategies[index] ?? options.strategy;
    const features = computeNumberFeatures(options.game, history, (options.seed ?? 1) + index, sourcePatternSignals);
    const numberScores = tuneNumberScores(
      scoreNumbers(strategy, features),
      options.randomStrength ?? 50,
      strategy === "high_return" ? (options.highReturnStrength ?? 50) : 50
    );
    const ticketNumbers = pickTicket(
      options.game,
      strategy,
      numberScores,
      history,
      random,
      usedNumbers,
      usedPairs,
      usedProfiles,
      options.candidateTuningMode ?? "light"
    );
    validateNumbers(options.game, ticketNumbers);
    for (const number of ticketNumbers) {
      usedNumbers.set(number, (usedNumbers.get(number) ?? 0) + 1);
    }
    for (const pair of pairKeys(ticketNumbers)) {
      usedPairs.set(pair, (usedPairs.get(pair) ?? 0) + 1);
    }
    const profile = rangeProfileKey(options.game, ticketNumbers);
    usedProfiles.set(profile, (usedProfiles.get(profile) ?? 0) + 1);
    const selectedScores = ticketNumbers
      .map((number) => numberScores.find((score) => score.number === number))
      .filter((score): score is NonNullable<typeof score> => Boolean(score));
    const combinationScores = scoreCombination(options.game, strategy, ticketNumbers, numberScores, history);
    const weights = strategyWeights[strategy];
    const totalScore =
      combinationScores.averageNumberScore +
      weights.ev_share * combinationScores.expectedShareScore +
      weights.combo_balance * combinationScores.balanceScore +
      weights.previous_overlap * combinationScores.previousDrawOverlapScore +
      combinationScores.diversityScore * 0.1;

    tickets.push({
      game: options.game,
      strategy,
      numbers: ticketNumbers,
      totalScore,
      numberScores: selectedScores,
      combinationScores,
      explanations: explainTicket(strategy, selectedScores, combinationScores),
      generatedAt: new Date().toISOString(),
      dataVersion: `${options.game}-${history.at(-1)?.drawNumber ?? "unknown"}`,
      disclaimer: buildDisclaimer(strategy) || BASE_DISCLAIMER
    });
  }

  return tickets;
}

function pickTicket(
  game: "loto6" | "loto7",
  strategy: StrategyType,
  numberScores: ReturnType<typeof scoreNumbers>,
  history: Draw[],
  random: () => number,
  usedNumbers: Map<number, number>,
  usedPairs: Map<string, number>,
  usedProfiles: Map<string, number>,
  candidateTuningMode: CandidateTuningMode
): number[] {
  const spec = GAME_SPECS[game];
  const filtered = numberScores.filter((score) => candidateTuningMode !== "strict" || score.feature.sourcePatternSignalScore < 1);
  const neutralBlend = Math.max(0, Math.min(1, strategyWeights[strategy].neutral_blend));
  const rawRanked = filtered.map((score) => {
    const reusePenalty = (usedNumbers.get(score.number) ?? 0) * 0.11;
    const tuningPenalty =
      candidateTuningMode === "focused"
        ? score.feature.candidateAdjustmentScore * 0.45
        : candidateTuningMode === "light"
          ? score.feature.candidateAdjustmentScore * 0.15
          : 0;
    return { ...score, rankScore: score.total - reusePenalty - tuningPenalty + random() * 0.03 };
  });
  // 根拠の弱いシグナルによる偏りを、一様抽出の平均値へ向けて引き戻す。
  // 当せん確率は数字の選び方で変わらないため、偏りは意図した分だけに抑える。
  const rawAverage = rawRanked.reduce((sum, item) => sum + item.rankScore, 0) / Math.max(1, rawRanked.length);
  const ranked = rawRanked
    .map((item) => ({
      ...item,
      rankScore: item.rankScore * (1 - neutralBlend) + rawAverage * neutralBlend
    }))
    .sort((a, b) => b.rankScore - a.rankScore);
  const rankScoreByNumber = new Map(ranked.map((item) => [item.number, item.rankScore]));
  const pairSignalContext = buildPairSignalContext(history);
  // 候補を上位数字だけに絞ると、当せん確率は変わらないまま分散だけが増えるため、
  // すべての数字を候補に残したうえで重み付き抽出で好みを反映する。
  const pool = shuffleWithRandom(ranked, random);

  let best: number[] | null = null;
  let bestScore = -Infinity;
  const attempts = strategy === "pure_random" ? 120 : 240;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = weightedSample(pool, spec.mainCount, random).sort((a, b) => a - b);
    if (!isWithinPlausibleRangeBand(candidate)) {
      continue;
    }
    if (strategy === "high_return" && candidate.filter((number) => number > 31).length < 1) {
      continue;
    }
    const combo = scoreCombination(game, strategy, candidate, numberScores, history);
    const portfolio = scorePortfolioSpread(game, candidate, usedNumbers, usedPairs, usedProfiles);
    const pairSignal = scoreHistoricalPairSignal(candidate, pairSignalContext);
    const weights = strategyWeights[strategy];
    const diversityWeight = game === "loto6" ? 0.1 : 0.05;
    const pairSignalWeight = game === "loto6" ? 0.04 : 0;
    const portfolioScoreWeight = 0.2;
    const portfolioPenaltyWeight = 1;
    const highReturnSumBonus = strategy === "high_return" ? scoreHighReturnSumBand(game, candidate) * 0.08 : 0;
    // 当せん確率は候補ごとに同じなので、比較しているのは主に
    // 当せんした場合に他の購入者と重なりにくいかどうか。
    const score =
      candidate.reduce((sum, number) => sum + (rankScoreByNumber.get(number) ?? 0), 0) /
        spec.mainCount +
      combo.expectedShareScore * weights.ev_share +
      combo.balanceScore * weights.combo_balance +
      combo.diversityScore * diversityWeight +
      pairSignal * pairSignalWeight +
      portfolio.score * portfolioScoreWeight +
      highReturnSumBonus -
      (1 - combo.previousDrawOverlapScore) * weights.previous_overlap -
      portfolio.penalty * portfolioPenaltyWeight;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  if (!best) {
    best = ranked.slice(0, spec.mainCount).map((score) => score.number).sort((a, b) => a - b);
  }
  return best;
}

/**
 * 32以上の数字だけを並べると人気は最も避けられるが、
 * 同じ考え方で買う人がまとまりやすく、ランダムな抽せん結果としても出にくい形になる。
 * 31以下を最低2個は残し、ランダムな抽せんで普通に起こりうる範囲に収める。
 */
function isWithinPlausibleRangeBand(candidate: number[]): boolean {
  return candidate.filter((number) => number <= 31).length >= 2;
}

function scorePortfolioSpread(
  game: GameType,
  candidate: number[],
  usedNumbers: Map<number, number>,
  usedPairs: Map<string, number>,
  usedProfiles: Map<string, number>
): { score: number; penalty: number } {
  if (usedNumbers.size === 0) {
    return { score: 1, penalty: 0 };
  }
  const unusedShare = candidate.filter((number) => !usedNumbers.has(number)).length / candidate.length;
  const averageNumberReuse =
    candidate.reduce((sum, number) => sum + (usedNumbers.get(number) ?? 0), 0) / candidate.length;
  const pairs = pairKeys(candidate);
  const averagePairReuse = pairs.reduce((sum, pair) => sum + (usedPairs.get(pair) ?? 0), 0) / Math.max(1, pairs.length);
  const profileReuse = usedProfiles.get(rangeProfileKey(game, candidate)) ?? 0;
  return {
    score: unusedShare,
    penalty: averageNumberReuse * 0.04 + averagePairReuse * 0.12 + profileReuse * 0.04
  };
}

type PairSignalContext = {
  counts: Map<string, number>;
  denominator: number;
};

function buildPairSignalContext(history: Draw[]): PairSignalContext | null {
  const recent = history.slice(-300);
  if (recent.length === 0) {
    return null;
  }
  const pairCounts = new Map<string, number>();
  for (const draw of recent) {
    for (const pair of pairKeys(draw.mainNumbers)) {
      pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
    }
  }
  return {
    counts: pairCounts,
    denominator: Math.max(1, recent.length * 0.025)
  };
}

function scoreHistoricalPairSignal(candidate: number[], context: PairSignalContext | null): number {
  if (!context) {
    return 0;
  }
  const values = pairKeys(candidate).map((pair) => context.counts.get(pair) ?? 0);
  const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  return Math.min(1, average / context.denominator);
}

function scoreHighReturnSumBand(game: GameType, candidate: number[]): number {
  const sum = candidate.reduce((total, number) => total + number, 0);
  const center = game === "loto6" ? 160 : 150;
  const width = game === "loto6" ? 45 : 40;
  return 1 - Math.min(1, Math.abs(sum - center) / width);
}

function pairKeys(numbers: number[]): string[] {
  const sorted = [...numbers].sort((a, b) => a - b);
  const pairs: string[] = [];
  for (let left = 0; left < sorted.length; left += 1) {
    for (let right = left + 1; right < sorted.length; right += 1) {
      pairs.push(`${sorted[left]}-${sorted[right]}`);
    }
  }
  return pairs;
}

function rangeProfileKey(game: GameType, numbers: number[]): string {
  const spec = GAME_SPECS[game];
  const lowCut = Math.ceil(spec.maxNumber / 3);
  const midCut = Math.ceil((spec.maxNumber * 2) / 3);
  const low = numbers.filter((number) => number <= lowCut).length;
  const mid = numbers.filter((number) => number > lowCut && number <= midCut).length;
  const high = numbers.length - low - mid;
  const odd = numbers.filter((number) => number % 2 === 1).length;
  return `${low}-${mid}-${high}-${odd}`;
}

function weightedSample(
  pool: Array<{ number: number; rankScore: number }>,
  count: number,
  random: () => number
): number[] {
  const selected: number[] = [];
  const remaining = [...pool];
  while (selected.length < count && remaining.length > 0) {
    const minScore = Math.min(...remaining.map((item) => item.rankScore));
    const weights = remaining.map((item) => Math.max(0.01, item.rankScore - minScore + 0.02));
    const total = weights.reduce((sum, value) => sum + value, 0);
    let pick = random() * total;
    let index = 0;
    for (; index < weights.length; index += 1) {
      pick -= weights[index];
      if (pick <= 0) {
        break;
      }
    }
    const [item] = remaining.splice(Math.min(index, remaining.length - 1), 1);
    selected.push(item.number);
  }
  return selected;
}

function expandStrategies(game: GameType, strategy: StrategyType, ticketCount: number, random: () => number): StrategyType[] {
  if (strategy !== "smart_mix") {
    return Array.from({ length: ticketCount }, () => strategy);
  }
  const choices: StrategyType[] =
    game === "loto6"
      ? ["pure_random", "pure_random", "high_return", "balance", "deep_gap", "hot_trend", "pattern_filter", "pure_random"]
      : ["balance", "hot_trend", "deep_gap", "high_return", "pure_random", "pattern_filter"];
  return Array.from({ length: ticketCount }, (_, index) => choices[(index + Math.floor(random() * choices.length)) % choices.length] ?? "balance");
}

function tuneNumberScores(
  scores: ReturnType<typeof scoreNumbers>,
  randomStrength: number,
  highReturnStrength: number
): ReturnType<typeof scoreNumbers> {
  const randomScale = (Math.max(0, Math.min(100, randomStrength)) - 50) / 100;
  const returnScale = (Math.max(0, Math.min(100, highReturnStrength)) - 50) / 100;
  return scores.map((score) => {
    const randomBoost = (score.feature.randomNoise - 0.5) * randomScale * 0.32;
    const returnBoost = (score.feature.antiPopularityScore + (score.feature.over31Flag ? 0.25 : 0)) * returnScale * 0.18;
    return {
      ...score,
      total: score.total + randomBoost + returnBoost,
      parts: {
        ...score.parts,
        random_tuning: randomBoost,
        return_tuning: returnBoost
      }
    };
  });
}
