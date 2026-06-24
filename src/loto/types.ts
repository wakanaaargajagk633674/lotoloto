export type GameType = "loto6" | "loto7";

export type StrategyType =
  | "balance"
  | "frequent"
  | "overdue"
  | "high_payout"
  | "random"
  | "sougaku_delete"
  | "mixed";

export type DeletionMode = "none" | "weak" | "strong" | "hard";

export type PrizeTier = {
  tier: number;
  winners: number | null;
  prizeYen: number | null;
};

export type Draw = {
  game: GameType;
  drawNumber: number;
  drawDate: string;
  dayOfWeek: string | null;
  mainNumbers: number[];
  bonusNumbers: number[];
  salesAmount: number | null;
  carryoverAmount: number | null;
  prizeTiers: PrizeTier[];
  source: string;
  sourceDownloadedAt: string | null;
  sourceHash: string | null;
};

export type NumberFeature = {
  game: GameType;
  drawNumber: number;
  number: number;
  totalFrequency: number;
  recent30Frequency: number;
  recent50Frequency: number;
  recent100Frequency: number;
  recent300Frequency: number;
  longTermFrequency: number;
  lastSeenGap: number;
  averageGap: number;
  maxGap: number;
  currentGapZScore: number;
  appearedInPreviousDraw: boolean;
  appearedInPreviousBonus: boolean;
  oddEven: "odd" | "even";
  rangeGroup: "low" | "mid" | "high";
  tensGroup: string;
  lastDigit: number;
  over31Flag: boolean;
  birthdayPopularityRisk: number;
  humanPopularityRisk: number;
  antiPopularityScore: number;
  deletionCandidateScore: number;
  sougakuDeletionScore: number;
  sougakuPartitionScore: number;
  carryoverContextScore: number;
  randomNoise: number;
  scoreParts: Record<string, number>;
};

export type CombinationScores = {
  sum: number;
  oddCount: number;
  evenCount: number;
  lowCount: number;
  midCount: number;
  highCount: number;
  over31Count: number;
  consecutivePairCount: number;
  maxConsecutiveRun: number;
  sameLastDigitCount: number;
  tensGroupDistribution: Record<string, number>;
  previousDrawOverlap: number;
  previousBonusOverlap: number;
  averageNumberScore: number;
  deletionRiskScore: number;
  popularityAvoidanceScore: number;
  balanceScore: number;
  diversityScore: number;
  explanationScore: number;
};

export type NumberScore = {
  number: number;
  total: number;
  parts: Record<string, number>;
  feature: NumberFeature;
};

export type PredictionTicket = {
  game: GameType;
  strategy: StrategyType;
  numbers: number[];
  totalScore: number;
  numberScores: NumberScore[];
  combinationScores: CombinationScores;
  explanations: string[];
  generatedAt: string;
  dataVersion: string;
  disclaimer: string;
};

export type GenerateOptions = {
  game: GameType;
  strategy: StrategyType;
  ticketCount: number;
  seed?: number;
  deletionMode?: DeletionMode;
};

export type StrategyWeights = {
  recent: number;
  long: number;
  gap: number;
  prev: number;
  bonus: number;
  anti_pop: number;
  deletion: number;
  sougaku: number;
  combo_balance: number;
  random: number;
};

export type BacktestStep = {
  game: GameType;
  strategy: StrategyType;
  trainThroughDraw: number;
  targetDraw: number;
  ticket: number[];
  actual: number[];
  bonus: number[];
  mainMatches: number;
  bonusMatches: number;
  prizeTier: number | null;
  payoutYen: number;
};

export type BacktestSummary = {
  game: GameType;
  startedAtDraw: number;
  endedAtDraw: number;
  ticketPriceYen: number;
  strategies: Record<
    StrategyType,
    {
      trials: number;
      averageMainMatches: number;
      match3PlusRate: number;
      prizeHitCount: number;
      totalPayoutYen: number;
      averagePayoutPerTicketYen: number;
      maxDrawdownYen: number;
    }
  >;
  notes: string[];
};
