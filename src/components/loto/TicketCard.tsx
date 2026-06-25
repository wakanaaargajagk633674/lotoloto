import NumberBall from "@/components/loto/NumberBall";
import ScoreBar from "@/components/loto/ScoreBar";
import ScoreRing from "@/components/loto/ScoreRing";
import TrendBadge from "@/components/loto/TrendBadge";
import { STRATEGY_LABELS } from "@/loto/constants";
import type { NumberScore, PredictionTicket } from "@/loto/types";

type Props = {
  ticket: PredictionTicket;
  index: number;
  onNumberSelect: (score: NumberScore) => void;
};

export default function TicketCard({ ticket, index, onNumberSelect }: Props) {
  const scoreByNumber = new Map(ticket.numberScores.map((score) => [score.number, score]));
  const patternScore = 1 - ticket.combinationScores.lowPrioritySignalScore;
  const trendScore = averagePart(ticket.numberScores, "recent");
  const gapScore = averagePart(ticket.numberScores, "gap");

  return (
    <article className="ticket-card">
      <div className="ticket-header">
        <div>
          <span className="ticket-index">Ticket {String(index + 1).padStart(2, "0")}</span>
          <h3>{STRATEGY_LABELS[ticket.strategy]}</h3>
        </div>
        <ScoreRing value={Math.max(0, Math.min(100, Math.round(ticket.totalScore * 45 + 55)))} label="総合" />
      </div>

      <div className="number-row">
        {ticket.numbers.map((number, numberIndex) => {
          const score = scoreByNumber.get(number);
          return (
            <NumberBall
              key={number}
              number={number}
              index={numberIndex}
              tone={score ? toneForScore(score) : "standard"}
              tuned={(score?.feature.candidateAdjustmentScore ?? 0) > 0.58}
              onClick={() => score && onNumberSelect(score)}
            />
          );
        })}
      </div>

      <div className="score-stack">
        <ScoreBar label="バランス" value={ticket.combinationScores.balanceScore} tone="cyan" />
        <ScoreBar label="トレンド" value={normalizeSignal(trendScore)} tone="emerald" />
        <ScoreBar label="ギャップ" value={normalizeSignal(gapScore)} tone="violet" />
        <ScoreBar label="人気回避" value={ticket.combinationScores.popularityAvoidanceScore} tone="gold" />
        <ScoreBar label="パターン調整" value={patternScore} tone="violet" />
      </div>

      <div className="ticket-tags">
        <TrendBadge>{ticket.combinationScores.oddCount}:{ticket.combinationScores.evenCount}</TrendBadge>
        <TrendBadge>合計 {ticket.combinationScores.sum}</TrendBadge>
        <TrendBadge>連番 {ticket.combinationScores.consecutivePairCount}</TrendBadge>
        <TrendBadge>31超 {ticket.combinationScores.over31Count}</TrendBadge>
      </div>

      <ul className="reason-list">
        {ticket.explanations.slice(0, 3).map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>

      <button className="ghost-action" type="button" onClick={() => navigator.clipboard?.writeText(ticket.numbers.join(" "))}>
        結果をコピー
      </button>
    </article>
  );
}

function averagePart(scores: NumberScore[], key: string): number {
  if (!scores.length) return 0;
  return scores.reduce((sum, score) => sum + (score.parts[key] ?? 0), 0) / scores.length;
}

function normalizeSignal(value: number): number {
  return Math.max(0, Math.min(1, 0.5 + value));
}

function toneForScore(score: NumberScore): "standard" | "trend" | "gap" | "return" {
  if (score.feature.over31Flag && score.feature.antiPopularityScore > 0.7) return "return";
  if ((score.parts.gap ?? 0) > (score.parts.recent ?? 0)) return "gap";
  if ((score.parts.recent ?? 0) > 0.08) return "trend";
  return "standard";
}
