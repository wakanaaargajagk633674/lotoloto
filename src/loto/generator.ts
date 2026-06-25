import { strategyWeights } from "@/config/strategyWeights";
import { BASE_DISCLAIMER, GAME_SPECS } from "./constants";
import { buildDisclaimer, explainTicket } from "./explanations";
import { computeNumberFeatures } from "./features";
import { createSeededRandom, shuffleWithRandom } from "./random";
import { scoreCombination, scoreNumbers } from "./scoring";
import { validateNumbers } from "./validation";
import type { CandidateTuningMode, Draw, GenerateOptions, PredictionTicket, StrategyType } from "./types";

export function generateTickets(draws: Draw[], options: GenerateOptions, sourcePatternSignals: number[] = []): PredictionTicket[] {
  const history = draws.filter((draw) => draw.game === options.game).sort((a, b) => a.drawNumber - b.drawNumber);
  if (history.length === 0) {
    throw new Error(`No draw history available for ${options.game}`);
  }
  const random = createSeededRandom(options.seed ?? 1);
  const strategies = expandStrategies(options.strategy, options.ticketCount, random);
  const tickets: PredictionTicket[] = [];
  const usedNumbers = new Map<number, number>();

  for (let index = 0; index < options.ticketCount; index += 1) {
    const strategy = strategies[index] ?? options.strategy;
    const features = computeNumberFeatures(options.game, history, (options.seed ?? 1) + index, sourcePatternSignals);
    const numberScores = tuneNumberScores(
      scoreNumbers(strategy, features),
      options.randomStrength ?? 50,
      strategy === "high_return" ? (options.highReturnStrength ?? 50) : 50
    );
    const ticketNumbers = pickTicket(options.game, strategy, numberScores, random, usedNumbers, options.candidateTuningMode ?? "light");
    validateNumbers(options.game, ticketNumbers);
    for (const number of ticketNumbers) {
      usedNumbers.set(number, (usedNumbers.get(number) ?? 0) + 1);
    }
    const selectedScores = ticketNumbers
      .map((number) => numberScores.find((score) => score.number === number))
      .filter((score): score is NonNullable<typeof score> => Boolean(score));
    const combinationScores = scoreCombination(options.game, strategy, ticketNumbers, numberScores, history);
    const weights = strategyWeights[strategy];
    const totalScore =
      combinationScores.averageNumberScore + weights.combo_balance * combinationScores.balanceScore + combinationScores.diversityScore * 0.1;

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
  random: () => number,
  usedNumbers: Map<number, number>,
  candidateTuningMode: CandidateTuningMode
): number[] {
  const spec = GAME_SPECS[game];
  const filtered = numberScores.filter((score) => candidateTuningMode !== "strict" || score.feature.sourcePatternSignalScore < 1);
  const ranked = filtered
    .map((score) => {
      const reusePenalty = (usedNumbers.get(score.number) ?? 0) * 0.08;
      const tuningPenalty =
        candidateTuningMode === "focused"
          ? score.feature.candidateAdjustmentScore * 0.45
          : candidateTuningMode === "light"
            ? score.feature.candidateAdjustmentScore * 0.15
            : 0;
      return { ...score, rankScore: score.total - reusePenalty - tuningPenalty + random() * 0.03 };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
  const poolSize = strategy === "pure_random" ? spec.maxNumber : Math.min(spec.maxNumber, spec.mainCount * 4);
  const pool = strategy === "pure_random" ? shuffleWithRandom(ranked, random) : ranked.slice(0, poolSize);

  let best: number[] | null = null;
  let bestScore = -Infinity;
  const attempts = strategy === "pure_random" ? 120 : 240;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = weightedSample(pool, spec.mainCount, random).sort((a, b) => a - b);
    if (strategy === "high_return" && candidate.filter((number) => number > 31).length < 1) {
      continue;
    }
    const combo = scoreCombination(game, strategy, candidate, numberScores, []);
    const score =
      candidate.reduce((sum, number) => sum + (ranked.find((item) => item.number === number)?.rankScore ?? 0), 0) /
        spec.mainCount +
      combo.balanceScore * strategyWeights[strategy].combo_balance +
      combo.popularityAvoidanceScore * 0.15;
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

function expandStrategies(strategy: StrategyType, ticketCount: number, random: () => number): StrategyType[] {
  if (strategy !== "smart_mix") {
    return Array.from({ length: ticketCount }, () => strategy);
  }
  const choices: StrategyType[] = ["balance", "hot_trend", "deep_gap", "high_return", "pure_random", "pattern_filter"];
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
