import ScoreBar from "@/components/loto/ScoreBar";
import type { NumberScore, PredictionTicket } from "@/loto/types";

type Selected = {
  ticket: PredictionTicket;
  score: NumberScore;
} | null;

export default function NumberReasonPanel({ selected, onClose }: { selected: Selected; onClose: () => void }) {
  if (!selected) {
    return null;
  }

  const { score } = selected;
  const feature = score.feature;
  return (
    <aside className="reason-panel" aria-label="数字ごとの理由">
      <button type="button" onClick={onClose} aria-label="閉じる">
        ×
      </button>
      <span className="section-kicker">Number Insight</span>
      <strong className="reason-number">{feature.number.toString().padStart(2, "0")}</strong>
      <p>過去傾向から、今回の組み合わせでは優先度を調整して評価した数字です。除外や的中保証を意味するものではありません。</p>
      <ScoreBar label="直近トレンド" value={normalize(score.parts.recent ?? 0)} tone="cyan" />
      <ScoreBar label="ギャップ" value={normalize(score.parts.gap ?? 0)} tone="violet" />
      <ScoreBar label="人気回避" value={feature.antiPopularityScore} tone="gold" />
      <ScoreBar label="候補調整" value={1 - feature.candidateAdjustmentScore} tone="emerald" />
      <ul>
        <li>直近100回で {feature.recent100Frequency} 回出現しています。</li>
        <li>前回出現から {feature.lastSeenGap} 回空いています。</li>
        <li>{feature.over31Flag ? "31超の数字として分配リスクを意識するモードで評価されます。" : "低・中数字帯のバランス補完に使われます。"}</li>
      </ul>
    </aside>
  );
}

function normalize(value: number): number {
  return Math.max(0, Math.min(1, 0.5 + value));
}
