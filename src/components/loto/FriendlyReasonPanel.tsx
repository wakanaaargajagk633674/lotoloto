import MetricWithLabel from "@/components/loto/MetricWithLabel";
import ScoreBar from "@/components/loto/ScoreBar";
import type { NumberScore, PredictionTicket } from "@/loto/types";

export type SelectedNumberInsight = {
  ticket: PredictionTicket;
  score: NumberScore;
} | null;

type Props = {
  selected: SelectedNumberInsight;
};

export default function FriendlyReasonPanel({ selected }: Props) {
  if (!selected) {
    return (
      <section className="friendly-reason-panel" aria-label="なぜこの数字">
        <p className="section-label">なぜこの数字？</p>
        <h2>数字をタップすると、理由をやさしく表示します。</h2>
        <p>
          各数字について、過去出現回数、直近100回での出現回数、前回からの間隔を確認できます。
          どれも参考情報であり、次回の当選を示すものではありません。
        </p>
      </section>
    );
  }

  const { score } = selected;
  const feature = score.feature;
  const numberLabel = feature.number.toString().padStart(2, "0");
  const referenceScore = Math.max(0, Math.min(100, Math.round(50 + score.total * 35)));

  return (
    <section className="friendly-reason-panel" aria-label="なぜこの数字">
      <p className="section-label">なぜこの数字？</p>
      <div className="reason-heading">
        <div>
          <span>選択中の数字</span>
          <strong>{numberLabel}</strong>
        </div>
        <p>
          この数字が今回の買い目に入った理由を、過去データの見方ごとに整理しています。
          当選の予測や保証ではありません。
        </p>
      </div>

      <div className="reason-metrics">
        <MetricWithLabel
          label="過去出現回数"
          value={feature.totalFrequency}
          unit="回"
          help="この数字が過去の本数字に含まれた回数です。"
        />
        <MetricWithLabel
          label="直近100回の出現回数"
          value={feature.recent100Frequency}
          unit="回"
          help="直近100回の抽選で、この数字が本数字に含まれた回数です。"
        />
        <MetricWithLabel
          label="前回からの間隔"
          value={feature.lastSeenGap}
          unit="回"
          help="この数字が最後に出てから、何回抽選が行われたかを示します。"
        />
        <MetricWithLabel
          label="参考スコア"
          value={referenceScore}
          unit="/ 100"
          help="複数の参考指標を合わせた相対スコアです。当選確率ではありません。"
        />
      </div>

      <div className="score-stack">
        <ScoreBar
          label="直近の出現傾向"
          value={normalize(score.parts.recent ?? 0)}
          tone="emerald"
          help="直近データで目立つかを見る参考指標です。"
        />
        <ScoreBar
          label="間隔の参考度"
          value={normalize(score.parts.gap ?? 0)}
          tone="violet"
          help="前回からの間隔をどの程度参考にしているかを示します。"
        />
        <ScoreBar
          label="分配リスク意識"
          value={feature.antiPopularityScore}
          tone="gold"
          help="誕生日などで選ばれやすい数字に偏りすぎないための参考指標です。"
        />
      </div>

      <ul className="friendly-reason-list">
        <li>直近100回で比較的よく出ている場合は、参考候補として少し見ています。</li>
        <li>31より大きい数字は、誕生日由来の数字だけに偏らないための参考になります。</li>
        <li>候補の優先度を下げる場合も、完全に除外するものではありません。</li>
      </ul>
    </section>
  );
}

function normalize(value: number): number {
  return Math.max(0, Math.min(1, 0.5 + value));
}
