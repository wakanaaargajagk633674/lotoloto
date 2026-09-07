export type GameType = "loto6" | "loto7";

export type StrategyType =
  | "balance"
  | "hot_trend"
  | "deep_gap"
  | "high_return"
  | "pure_random"
  | "pattern_filter"
  | "smart_mix";

export type CandidateTuningMode = "off" | "light" | "focused" | "strict";

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
  popularityPrior: number;
  popularityEmpirical: number | null;
  popularityIndex: number;
  candidateAdjustmentScore: number;
  sourcePatternSignalScore: number;
  sourcePatternBalanceScore: number;
  carryoverContextScore: number;
  /** 経験ベイズ縮小後の、1回の抽せんでこの数字が本数字に含まれる事後確率。 */
  posteriorProbability: number;
  /** カイ二乗検定で説明できない超過分散の割合 (0-1)。0 なら頻度の偏りは偶然の範囲。 */
  frequencyEvidence: number;
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
  previousDrawOverlapRate: number;
  previousDrawOverlapScore: number;
  previousDrawOverlapBand: "common" | "normal" | "rare" | "extreme";
  averageNumberScore: number;
  lowPrioritySignalScore: number;
  popularityAvoidanceScore: number;
  combinationPopularityIndex: number;
  expectedShareScore: number;
  expectedShareReasons: string[];
  /** 平均的な買い方に対する相対的な買われやすさ (1 = 平均)。回帰が使えないときは null。 */
  relativePopularity: number | null;
  /** 1等当せん時の同時当せん者数の期待値。回帰が使えないときは null。 */
  expectedCoWinners: number | null;
  /** E[受取 | 1等] を独占時 1 とした係数。回帰が使えないときは null。 */
  payoutFactor: number | null;
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
  candidateTuningMode?: CandidateTuningMode;
  randomStrength?: number;
  highReturnStrength?: number;
};

export type StrategyWeights = {
  recent: number;
  long: number;
  gap: number;
  prev: number;
  bonus: number;
  anti_pop: number;
  candidate_tuning: number;
  pattern_filter: number;
  previous_overlap: number;
  combo_balance: number;
  random: number;
  /** 当せん時の分配人数を抑えることを狙う重み。当せん確率には影響しない。 */
  ev_share: number;
  /** 根拠の弱いシグナルによる偏りを一様抽出へ引き戻す割合。1 に近いほど中立。 */
  neutral_blend: number;
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
  combinationPopularityIndex: number;
  /** 予想時点のデータだけから求めた 1等の期待受取係数。null は回帰が使えなかった回。 */
  payoutFactor: number | null;
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
      /** 買い目の推定人気度の平均。低いほど当せん時の分配人数が少ないと見込まれる。 */
      averageCombinationPopularityIndex: number;
      /** 選ばれた数字の周辺分布が一様からどれだけ離れているか。0 が完全一様。 */
      selectionEntropyGap: number;
      /** 1等の期待受取係数の平均。高いほど当せん時の独占に近い。当せん確率とは無関係。 */
      averagePayoutFactor: number;
      /** 全口の 3 個組がどれだけ重複せず散らばっているか (0-1)。 */
      tripleCoverageRatio: number;
    }
  >;
  notes: string[];
};
