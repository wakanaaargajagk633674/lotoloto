import { GAME_SPECS } from "./constants";
import { generateTickets } from "./generator";
import type { BacktestStep, BacktestSummary, Draw, GameType, StrategyType } from "./types";

const DEFAULT_STRATEGIES: StrategyType[] = [
  "balance",
  "hot_trend",
  "deep_gap",
  "high_return",
  "pure_random",
  "pattern_filter",
  "smart_mix"
];

export function runWalkForwardBacktest(
  draws: Draw[],
  game: GameType,
  options: { minTrainingDraws?: number; strategies?: StrategyType[]; seed?: number } = {}
): { summary: BacktestSummary; detail: BacktestStep[] } {
  const gameDraws = draws.filter((draw) => draw.game === game).sort((a, b) => a.drawNumber - b.drawNumber);
  const minTrainingDraws = Math.min(options.minTrainingDraws ?? (game === "loto6" ? 300 : 120), Math.max(1, gameDraws.length - 1));
  const strategies = options.strategies ?? DEFAULT_STRATEGIES;
  const detail: BacktestStep[] = [];

  for (let targetIndex = minTrainingDraws; targetIndex < gameDraws.length; targetIndex += 1) {
    const history = gameDraws.slice(0, targetIndex);
    const actual = gameDraws[targetIndex];
    for (const strategy of strategies) {
      const [ticket] = generateTickets(history, {
        game,
        strategy,
        ticketCount: 1,
        seed: (options.seed ?? 7) + targetIndex * 100 + strategies.indexOf(strategy),
        candidateTuningMode: strategy === "pattern_filter" ? "focused" : "light"
      });
      const mainMatches = ticket.numbers.filter((number) => actual.mainNumbers.includes(number)).length;
      const bonusMatches = ticket.numbers.filter((number) => actual.bonusNumbers.includes(number)).length;
      const prizeTier = classifyPrize(game, mainMatches, bonusMatches);
      detail.push({
        game,
        strategy,
        trainThroughDraw: history.at(-1)?.drawNumber ?? 0,
        targetDraw: actual.drawNumber,
        ticket: ticket.numbers,
        actual: actual.mainNumbers,
        bonus: actual.bonusNumbers,
        mainMatches,
        bonusMatches,
        prizeTier,
        payoutYen: payoutForTier(actual, prizeTier),
        combinationPopularityIndex: ticket.combinationScores.combinationPopularityIndex
      });
    }
  }

  return {
    summary: summarizeBacktest(game, detail, minTrainingDraws, gameDraws.at(-1)?.drawNumber ?? 0),
    detail
  };
}

export function classifyPrize(game: GameType, mainMatches: number, bonusMatches: number): number | null {
  if (game === "loto6") {
    if (mainMatches === 6) return 1;
    if (mainMatches === 5 && bonusMatches >= 1) return 2;
    if (mainMatches === 5) return 3;
    if (mainMatches === 4) return 4;
    if (mainMatches === 3) return 5;
    return null;
  }
  if (mainMatches === 7) return 1;
  if (mainMatches === 6 && bonusMatches >= 1) return 2;
  if (mainMatches === 6) return 3;
  if (mainMatches === 5) return 4;
  if (mainMatches === 4) return 5;
  if (mainMatches === 3 && bonusMatches >= 1) return 6;
  return null;
}

function payoutForTier(draw: Draw, tier: number | null): number {
  if (!tier) {
    return 0;
  }
  return draw.prizeTiers.find((prize) => prize.tier === tier)?.prizeYen ?? 0;
}

function summarizeBacktest(game: GameType, detail: BacktestStep[], startedAtDraw: number, endedAtDraw: number): BacktestSummary {
  const spec = GAME_SPECS[game];
  const strategies = [...new Set(detail.map((step) => step.strategy))] as StrategyType[];
  return {
    game,
    startedAtDraw,
    endedAtDraw,
    ticketPriceYen: spec.ticketPriceYen,
    strategies: Object.fromEntries(
      strategies.map((strategy) => {
        const rows = detail.filter((step) => step.strategy === strategy);
        const trials = rows.length;
        const totalPayoutYen = rows.reduce((sum, row) => sum + row.payoutYen, 0);
        return [
          strategy,
          {
            trials,
            averageMainMatches: safeAverage(rows.map((row) => row.mainMatches)),
            match3PlusRate: trials ? rows.filter((row) => row.mainMatches >= 3).length / trials : 0,
            prizeHitCount: rows.filter((row) => row.prizeTier !== null).length,
            totalPayoutYen,
            averagePayoutPerTicketYen: trials ? totalPayoutYen / trials : 0,
            maxDrawdownYen: computeMaxDrawdown(rows.map((row) => row.payoutYen - spec.ticketPriceYen)),
            averageCombinationPopularityIndex: safeAverage(rows.map((row) => row.combinationPopularityIndex)),
            selectionEntropyGap: computeSelectionEntropyGap(game, rows)
          }
        ];
      })
    ) as BacktestSummary["strategies"],
    notes: [
      "ウォークフォワード方式で、各 targetDraw の予想には trainThroughDraw までの履歴だけを使う。",
      "ランダムとの差は短期では大きく揺れるため、優位に見える結果でも過剰最適化を疑う。",
      "パターンフィルターは固定除外ではなく、候補の優先度を調整する soft signal として扱う。",
    "averageCombinationPopularityIndex は当せんした場合の分配人数の目安で、当せん確率とは無関係。",
    "selectionEntropyGap は数字の選び方が一様からどれだけ離れているかで、0 に近いほど偏りが小さい。"
    ]
  };
}

/**
 * 選ばれた数字の周辺分布が一様からどれだけ離れているかを、全変動距離で測る。
 * 0 が完全一様で、値が大きいほど特定の数字に偏って買い目を作っている。
 * 当せん確率は数字の偏りでは改善しないため、この値は小さいほど素直な作り方になる。
 */
function computeSelectionEntropyGap(game: GameType, rows: BacktestStep[]): number {
  const spec = GAME_SPECS[game];
  const picks = rows.flatMap((row) => row.ticket);
  if (picks.length === 0) {
    return 0;
  }
  const counts = new Map<number, number>();
  for (const number of picks) {
    counts.set(number, (counts.get(number) ?? 0) + 1);
  }
  const uniform = 1 / spec.maxNumber;
  let distance = 0;
  for (let number = 1; number <= spec.maxNumber; number += 1) {
    distance += Math.abs((counts.get(number) ?? 0) / picks.length - uniform);
  }
  return distance / 2;
}

function safeAverage(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function computeMaxDrawdown(returns: number[]): number {
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const value of returns) {
    equity += value;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }
  return maxDrawdown;
}

export function serializeBacktestDetailCsv(rows: BacktestStep[]): string {
  const headers = [
    "game",
    "strategy",
    "trainThroughDraw",
    "targetDraw",
    "ticket",
    "actual",
    "bonus",
    "mainMatches",
    "bonusMatches",
    "prizeTier",
    "payoutYen",
    "combinationPopularityIndex"
  ];
  const lines = rows.map((row) =>
    [
      row.game,
      row.strategy,
      row.trainThroughDraw,
      row.targetDraw,
      row.ticket.join(" "),
      row.actual.join(" "),
      row.bonus.join(" "),
      row.mainMatches,
      row.bonusMatches,
      row.prizeTier ?? "",
      row.payoutYen,
      row.combinationPopularityIndex.toFixed(4)
    ].join(",")
  );
  return `${headers.join(",")}\n${lines.join("\n")}\n`;
}
