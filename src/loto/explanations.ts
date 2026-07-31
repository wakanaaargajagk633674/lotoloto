import { BASE_DISCLAIMER, HIGH_PAYOUT_DISCLAIMER, PATTERN_FILTER_DISCLAIMER } from "./constants";
import type { CombinationScores, NumberScore, StrategyType } from "./types";

export function buildDisclaimer(strategy: StrategyType): string {
  const extras: string[] = [];
  if (strategy === "high_return") {
    extras.push(HIGH_PAYOUT_DISCLAIMER);
  }
  if (strategy === "pattern_filter") {
    extras.push(PATTERN_FILTER_DISCLAIMER);
  }
  return [BASE_DISCLAIMER, ...extras].join(" ");
}

export function explainTicket(strategy: StrategyType, scores: NumberScore[], combo: CombinationScores): string[] {
  const explanations = scores.slice(0, 4).map((score) => {
    const feature = score.feature;
    const number = feature.number.toString().padStart(2, "0");
    if (strategy === "high_return" && feature.over31Flag) {
      return `数字 ${number} は31より大きい数字です。誕生日で選ばれやすい1から31だけに偏らないよう、組み合わせに入れています。`;
    }
    if (strategy === "hot_trend") {
      return `数字 ${number} は直近100回で ${feature.recent100Frequency} 回、本数字に含まれています。よく出ている数字の参考候補として見ています。`;
    }
    if (strategy === "deep_gap") {
      return `数字 ${number} は前回出てから ${feature.lastSeenGap} 回あいています。間隔を見るための参考候補として扱っています。`;
    }
    if (strategy === "pattern_filter") {
      return `数字 ${number} は過去の並び方とのバランスを見て、今回は候補の優先度を調整しています。除外を意味するものではありません。`;
    }
    return `数字 ${number} は出現回数、前回からの間隔、全体の散らばりを見て、今回の組み合わせに入れています。`;
  });
  explanations.push(
    `この買い目は、奇数 ${combo.oddCount} 個、偶数 ${combo.evenCount} 個、合計値 ${combo.sum}、連番 ${combo.consecutivePairCount} 組です。`
  );
  explanations.push(
    `前回本数字との重なりは ${combo.previousDrawOverlap} 個です。過去の重なり分布では約 ${Math.round(
      combo.previousDrawOverlapRate * 100
    )}% の出方として扱い、極端さの確認だけに使っています。`
  );
  if (combo.expectedShareReasons.length > 0) {
    explanations.push(
      `他の購入者との重なりにくさの目安は ${Math.round(combo.expectedShareScore * 100)} です。${combo.expectedShareReasons[0]}`
    );
  }
  explanations.push(
    "重なりにくさは、当たりやすさではなく、当せんした場合の分配人数に関する目安です。当せん確率はどの数字を選んでも変わりません。"
  );
  explanations.push("表示しているスコアは参考指標です。当選確率や回収を保証するものではありません。");
  return explanations;
}
