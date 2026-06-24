import { BASE_DISCLAIMER, HIGH_PAYOUT_DISCLAIMER, SOUGAKU_DELETE_DISCLAIMER } from "./constants";
import type { CombinationScores, NumberScore, StrategyType } from "./types";

export function buildDisclaimer(strategy: StrategyType): string {
  const extras: string[] = [];
  if (strategy === "high_payout") {
    extras.push(HIGH_PAYOUT_DISCLAIMER);
  }
  if (strategy === "sougaku_delete") {
    extras.push(SOUGAKU_DELETE_DISCLAIMER);
  }
  return [BASE_DISCLAIMER, ...extras].join(" ");
}

export function explainTicket(strategy: StrategyType, scores: NumberScore[], combo: CombinationScores): string[] {
  const explanations = scores.slice(0, 4).map((score) => {
    const feature = score.feature;
    if (strategy === "high_payout" && feature.over31Flag) {
      return `${feature.number} は31超の数字で、人気数字の重なりを避ける観点から採用しました。`;
    }
    if (strategy === "frequent") {
      return `${feature.number} は直近100回の出現回数が ${feature.recent100Frequency} 回で、この戦略内では相対的に高めです。`;
    }
    if (strategy === "overdue") {
      return `${feature.number} は前回出現から ${feature.lastSeenGap} 回空いており、未出現テーマのスコアに寄与しました。`;
    }
    if (strategy === "sougaku_delete") {
      return `${feature.number} は削除候補スコアと分割バランスを soft penalty として評価した結果、組み合わせに残りました。`;
    }
    return `${feature.number} は頻度、未出現期間、人気回避、組み合わせバランスを合わせた相対スコアで採用しました。`;
  });
  explanations.push(
    `組み合わせ全体は奇数${combo.oddCount}個・偶数${combo.evenCount}個、合計${combo.sum}、連番ペア${combo.consecutivePairCount}組です。`
  );
  explanations.push("各スコアは当せん確率ではなく、選び方のテーマを説明するための相対指標です。");
  return explanations;
}
