import MetricWithLabel from "@/components/loto/MetricWithLabel";
import NumberBall from "@/components/loto/NumberBall";
import ScoreRing from "@/components/loto/ScoreRing";
import { GAME_SPECS, STRATEGY_LABELS } from "@/loto/constants";
import type { NumberScore, PredictionTicket } from "@/loto/types";

type Props = {
  ticket: PredictionTicket;
  index: number;
  onNumberSelect: (score: NumberScore) => void;
};

export default function GentleTicketCard({ ticket, index, onNumberSelect }: Props) {
  const scoreByNumber = new Map(ticket.numberScores.map((score) => [score.number, score]));
  const totalScore = Math.max(0, Math.min(100, Math.round(ticket.totalScore * 45 + 55)));
  const firstScore = scoreByNumber.get(ticket.numbers[0]);

  return (
    <article className="gentle-ticket-card">
      <div className="ticket-header">
        <div>
          <span className="ticket-index">買い目 {index + 1}</span>
          <h3>
            {GAME_SPECS[ticket.game].label} / {STRATEGY_LABELS[ticket.strategy]}
          </h3>
        </div>
        <ScoreRing value={totalScore} label="総合バランス" />
      </div>

      <div className="number-row" aria-label="買い目の数字">
        {ticket.numbers.map((number, numberIndex) => {
          const score = scoreByNumber.get(number);
          return (
            <NumberBall
              key={number}
              number={number}
              index={numberIndex}
              tone={score ? toneForScore(score) : "standard"}
              tuned={(score?.feature.candidateAdjustmentScore ?? 0) > 0.58}
              reasonLabel={score ? reasonLabelForScore(score) : undefined}
              onClick={() => score && onNumberSelect(score)}
            />
          );
        })}
      </div>

      <p className="ticket-comment">
        この買い目は、数字の散らばりと奇数偶数のまとまりを見ながら作った参考候補です。
      </p>

      <div className="ticket-feature-grid">
        <MetricWithLabel
          label="奇数偶数のバランス"
          value={`${ticket.combinationScores.oddCount} 対 ${ticket.combinationScores.evenCount}`}
          help="買い目の中にある奇数と偶数の個数です。偏りを確認するための参考情報です。"
        />
        <MetricWithLabel
          label="合計値"
          value={ticket.combinationScores.sum}
          help="買い目に含まれる数字をすべて足した値です。過去の分布と比べる参考にします。"
        />
        <MetricWithLabel
          label="前回数字との重なり"
          value={`${ticket.combinationScores.previousDrawOverlap} 個`}
          detail={`過去分布では約 ${Math.round(ticket.combinationScores.previousDrawOverlapRate * 100)}%`}
          help="前回の本数字と今回の買い目が何個重なっているかです。極端な買い目を避けるための参考情報で、当選確率を示すものではありません。"
        />
        <MetricWithLabel
          label="32以上の数字"
          value={ticket.combinationScores.over31Count}
          unit="個"
          help="誕生日で選ばれやすい1から31だけに偏っていないかを見る参考情報です。"
        />
      </div>

      <ul className="reason-list">
        {ticket.explanations.slice(0, 3).map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>

      <div className="ticket-actions">
        <button className="secondary-action" type="button" onClick={() => firstScore && onNumberSelect(firstScore)}>
          詳細を見る
        </button>
        <button className="ghost-action" type="button" onClick={() => navigator.clipboard?.writeText(ticket.numbers.join(" "))}>
          数字をコピー
        </button>
      </div>
    </article>
  );
}

function reasonLabelForScore(score: NumberScore): string {
  if (score.feature.over31Flag && score.feature.antiPopularityScore > 0.7) return "32以上";
  if ((score.parts.gap ?? 0) > (score.parts.recent ?? 0)) return "間隔参考";
  if ((score.parts.recent ?? 0) > 0.08) return "出現多め";
  if (score.feature.candidateAdjustmentScore > 0.58) return "調整あり";
  return "バランス";
}

function toneForScore(score: NumberScore): "standard" | "trend" | "gap" | "return" {
  if (score.feature.over31Flag && score.feature.antiPopularityScore > 0.7) return "return";
  if ((score.parts.gap ?? 0) > (score.parts.recent ?? 0)) return "gap";
  if ((score.parts.recent ?? 0) > 0.08) return "trend";
  return "standard";
}
