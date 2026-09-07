import { GAME_SPECS } from "./constants";
import { chiSquareUniformity, estimateTicketVolumes, fitPopularityRegression, type UniformityTest } from "./mathCore";
import type { Draw, GameType } from "./types";

export type NumberAnalysis = {
  number: number;
  totalFrequency: number;
  recent30Frequency: number;
  recent50Frequency: number;
  recent100Frequency: number;
  recent300Frequency: number;
  lastSeenDraw: number | null;
  lastSeenGap: number;
  averageGap: number | null;
  maxGap: number | null;
};

export type DistributionRow = {
  label: string;
  count: number;
  rate: number;
};

export type LotoAnalysis = {
  game: GameType;
  latestDraw: Draw | null;
  recentDraws: Draw[];
  drawCount: number;
  numberAnalysis: NumberAnalysis[];
  oddEvenDistribution: DistributionRow[];
  sumStats: {
    average: number;
    median: number;
    min: number;
    max: number;
    latest: number | null;
  };
  consecutiveDistribution: DistributionRow[];
  rangeDistribution: DistributionRow[];
  lastDigitDistribution: DistributionRow[];
  previousOverlapDistribution: DistributionRow[];
  carryover: {
    occurrenceCount: number;
    maxAmount: number;
    latestAmount: number;
  };
  prizeStats: Array<{
    tier: number;
    averagePrizeYen: number | null;
    maxPrizeYen: number | null;
    averageWinners: number | null;
  }>;
  /** 出現回数が一様抽せんと矛盾しないかのカイ二乗検定。 */
  uniformity: UniformityTest;
  /** 固定賞金等級の当せん口数から復元した直近の販売口数。 */
  estimatedTicketVolume: number | null;
  /** 口数データからの人気度回帰。数字ごとの対数人気度 β (正 = 買われやすい)。 */
  popularityRegression: {
    observations: number;
    rSquared: number;
    beta: Array<{ number: number; beta: number }>;
  } | null;
};

export function buildLotoAnalysis(game: GameType, draws: Draw[]): LotoAnalysis {
  const sorted = [...draws].sort((a, b) => a.drawNumber - b.drawNumber);
  const latestDraw = sorted.at(-1) ?? null;
  return {
    game,
    latestDraw,
    recentDraws: sorted.slice(-30).reverse(),
    drawCount: sorted.length,
    numberAnalysis: buildNumberAnalysis(game, sorted),
    oddEvenDistribution: buildOddEvenDistribution(game, sorted),
    sumStats: buildSumStats(sorted),
    consecutiveDistribution: buildConsecutiveDistribution(sorted),
    rangeDistribution: buildRangeDistribution(game, sorted),
    lastDigitDistribution: buildLastDigitDistribution(sorted),
    previousOverlapDistribution: buildPreviousOverlapDistribution(sorted),
    carryover: {
      occurrenceCount: sorted.filter((draw) => (draw.carryoverAmount ?? 0) > 0).length,
      maxAmount: Math.max(0, ...sorted.map((draw) => draw.carryoverAmount ?? 0)),
      latestAmount: latestDraw?.carryoverAmount ?? 0
    },
    prizeStats: buildPrizeStats(game, sorted),
    uniformity: chiSquareUniformity(countMainNumbers(sorted), game, sorted.length),
    estimatedTicketVolume: latestDraw ? (estimateTicketVolumes(game, sorted).get(latestDraw.drawNumber) ?? null) : null,
    popularityRegression: buildPopularityRegressionSummary(game, sorted)
  };
}

function countMainNumbers(draws: Draw[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const draw of draws) {
    for (const number of draw.mainNumbers) {
      counts.set(number, (counts.get(number) ?? 0) + 1);
    }
  }
  return counts;
}

function buildPopularityRegressionSummary(game: GameType, draws: Draw[]): LotoAnalysis["popularityRegression"] {
  const regression = fitPopularityRegression(game, draws);
  if (!regression) {
    return null;
  }
  return {
    observations: regression.observations,
    rSquared: regression.rSquared,
    beta: [...regression.beta.entries()].map(([number, beta]) => ({ number, beta }))
  };
}

export function buildNumberAnalysis(game: GameType, draws: Draw[]): NumberAnalysis[] {
  const maxNumber = GAME_SPECS[game].maxNumber;
  const latestDrawNumber = draws.at(-1)?.drawNumber ?? 0;
  return Array.from({ length: maxNumber }, (_, index) => index + 1).map((number) => {
    const appearedDraws = draws.filter((draw) => draw.mainNumbers.includes(number)).map((draw) => draw.drawNumber);
    const gaps = appearedDraws.slice(1).map((drawNumber, gapIndex) => drawNumber - appearedDraws[gapIndex]);
    const lastSeenDraw = appearedDraws.at(-1) ?? null;
    return {
      number,
      totalFrequency: appearedDraws.length,
      recent30Frequency: countRecent(draws, number, 30),
      recent50Frequency: countRecent(draws, number, 50),
      recent100Frequency: countRecent(draws, number, 100),
      recent300Frequency: countRecent(draws, number, 300),
      lastSeenDraw,
      lastSeenGap: lastSeenDraw ? latestDrawNumber - lastSeenDraw : latestDrawNumber,
      averageGap: gaps.length ? average(gaps) : null,
      maxGap: gaps.length ? Math.max(...gaps) : null
    };
  });
}

export function buildCarryoverRows(draws: Draw[]) {
  return draws.map((draw) => ({
    drawNumber: draw.drawNumber,
    drawDate: draw.drawDate,
    salesAmount: draw.salesAmount,
    carryoverAmount: draw.carryoverAmount,
    firstPrizeWinners: draw.prizeTiers.find((tier) => tier.tier === 1)?.winners ?? null,
    firstPrizeYen: draw.prizeTiers.find((tier) => tier.tier === 1)?.prizeYen ?? null
  }));
}

export function buildPrizeRows(draws: Draw[]) {
  return draws.flatMap((draw) =>
    draw.prizeTiers.map((tier) => ({
      drawNumber: draw.drawNumber,
      drawDate: draw.drawDate,
      tier: tier.tier,
      winners: tier.winners,
      prizeYen: tier.prizeYen
    }))
  );
}

function buildOddEvenDistribution(game: GameType, draws: Draw[]): DistributionRow[] {
  const maxMainCount = GAME_SPECS[game].mainCount;
  const counts = new Map<string, number>();
  for (const draw of draws) {
    const odd = draw.mainNumbers.filter((number) => number % 2 === 1).length;
    const label = `${odd}:${maxMainCount - odd}`;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return distributionRows(counts, draws.length);
}

function buildSumStats(draws: Draw[]) {
  const sums = draws.map((draw) => draw.mainNumbers.reduce((sum, number) => sum + number, 0)).sort((a, b) => a - b);
  const latest = draws.at(-1)?.mainNumbers.reduce((sum, number) => sum + number, 0) ?? null;
  return {
    average: sums.length ? average(sums) : 0,
    median: sums.length ? sums[Math.floor(sums.length / 2)] : 0,
    min: sums.at(0) ?? 0,
    max: sums.at(-1) ?? 0,
    latest
  };
}

function buildConsecutiveDistribution(draws: Draw[]): DistributionRow[] {
  const counts = new Map<string, number>();
  for (const draw of draws) {
    const pairs = draw.mainNumbers.slice(1).filter((number, index) => number === draw.mainNumbers[index] + 1).length;
    const label = pairs === 0 ? "連番なし" : pairs === 1 ? "1組" : "2組以上";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return distributionRows(counts, draws.length);
}

function buildRangeDistribution(game: GameType, draws: Draw[]): DistributionRow[] {
  const ranges = game === "loto6" ? [[1, 10], [11, 20], [21, 30], [31, 43]] : [[1, 10], [11, 20], [21, 30], [31, 37]];
  const counts = new Map<string, number>();
  for (const [from, to] of ranges) {
    counts.set(`${from}〜${to}`, draws.reduce((sum, draw) => sum + draw.mainNumbers.filter((number) => number >= from && number <= to).length, 0));
  }
  return distributionRows(counts, draws.reduce((sum, draw) => sum + draw.mainNumbers.length, 0));
}

function buildLastDigitDistribution(draws: Draw[]): DistributionRow[] {
  const counts = new Map<string, number>();
  for (let digit = 0; digit <= 9; digit += 1) counts.set(String(digit), 0);
  for (const draw of draws) {
    for (const number of draw.mainNumbers) {
      const digit = String(number % 10);
      counts.set(digit, (counts.get(digit) ?? 0) + 1);
    }
  }
  return distributionRows(counts, draws.reduce((sum, draw) => sum + draw.mainNumbers.length, 0));
}

function buildPreviousOverlapDistribution(draws: Draw[]): DistributionRow[] {
  const counts = new Map<string, number>();
  for (let index = 1; index < draws.length; index += 1) {
    const overlap = draws[index].mainNumbers.filter((number) => draws[index - 1].mainNumbers.includes(number)).length;
    counts.set(`${overlap}個`, (counts.get(`${overlap}個`) ?? 0) + 1);
  }
  return distributionRows(counts, Math.max(1, draws.length - 1));
}

function buildPrizeStats(game: GameType, draws: Draw[]) {
  const tierCount = game === "loto6" ? 5 : 6;
  return Array.from({ length: tierCount }, (_, index) => index + 1).map((tier) => {
    const rows = draws.map((draw) => draw.prizeTiers.find((item) => item.tier === tier)).filter((item) => item !== undefined);
    const prizes = rows.map((row) => row.prizeYen).filter((value): value is number => value !== null);
    const winners = rows.map((row) => row.winners).filter((value): value is number => value !== null);
    return {
      tier,
      averagePrizeYen: prizes.length ? average(prizes) : null,
      maxPrizeYen: prizes.length ? Math.max(...prizes) : null,
      averageWinners: winners.length ? average(winners) : null
    };
  });
}

function countRecent(draws: Draw[], number: number, recentCount: number): number {
  return draws.slice(-recentCount).filter((draw) => draw.mainNumbers.includes(number)).length;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function distributionRows(counts: Map<string, number>, total: number): DistributionRow[] {
  return [...counts.entries()].map(([label, count]) => ({
    label,
    count,
    rate: total ? count / total : 0
  }));
}
