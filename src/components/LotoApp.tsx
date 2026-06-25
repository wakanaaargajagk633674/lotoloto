"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/loto/AppShell";
import BacktestSummaryCard from "@/components/loto/BacktestSummaryCard";
import CarryoverCard from "@/components/loto/CarryoverCard";
import EmptyState from "@/components/loto/EmptyState";
import HeroSection from "@/components/loto/HeroSection";
import InsightCard from "@/components/loto/InsightCard";
import NumberReasonPanel from "@/components/loto/NumberReasonPanel";
import RiskNotice from "@/components/loto/RiskNotice";
import StrategySelector from "@/components/loto/StrategySelector";
import TicketCard from "@/components/loto/TicketCard";
import AdvancedSettingsPanel from "@/components/loto/AdvancedSettingsPanel";
import { GAME_SPECS } from "@/loto/constants";
import { generateTickets } from "@/loto/generator";
import { listStrategies } from "@/loto/strategies";
import type { BacktestSummary, CandidateTuningMode, Draw, GameType, NumberScore, PredictionTicket, StrategyType } from "@/loto/types";

type Props = {
  initialDraws: Record<GameType, Draw[]>;
  backtests: Partial<Record<GameType, BacktestSummary>>;
};

type SelectedNumber = {
  ticket: PredictionTicket;
  score: NumberScore;
};

export default function LotoApp({ initialDraws, backtests }: Props) {
  const [game, setGame] = useState<GameType>("loto6");
  const [strategy, setStrategy] = useState<StrategyType>("balance");
  const [ticketCount, setTicketCount] = useState(5);
  const [seed, setSeed] = useState(20260625);
  const [randomStrength, setRandomStrength] = useState(55);
  const [patternFilterStrength, setPatternFilterStrength] = useState(45);
  const [highReturnStrength, setHighReturnStrength] = useState(60);
  const [selectedNumber, setSelectedNumber] = useState<SelectedNumber | null>(null);

  const candidateTuningMode = useMemo<CandidateTuningMode>(() => {
    if (patternFilterStrength <= 10) return "off";
    if (patternFilterStrength <= 45) return "light";
    if (patternFilterStrength <= 80) return "focused";
    return "strict";
  }, [patternFilterStrength]);

  const tickets = useMemo<PredictionTicket[]>(() => {
    const draws = initialDraws[game];
    if (!draws.length) {
      return [];
    }
    return generateTickets(draws, {
      game,
      strategy,
      ticketCount,
      seed,
      candidateTuningMode,
      randomStrength,
      highReturnStrength
    });
  }, [candidateTuningMode, game, highReturnStrength, initialDraws, randomStrength, seed, strategy, ticketCount]);

  const stats = useMemo(() => buildDashboardStats(initialDraws[game]), [game, initialDraws]);
  const latest = initialDraws[game].at(-1);
  const strategies = listStrategies();

  return (
    <AppShell>
      <HeroSection
        game={game}
        latestDraw={latest}
        onGameChange={setGame}
        onStart={() => document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />

      <section className="workspace-grid" id="generator">
        <div className="generator-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Selection Studio</p>
              <h2>参考買い目を生成</h2>
            </div>
            <button className="primary-action" type="button" onClick={() => setSeed((value) => value + 1)}>
              もう一度生成
            </button>
          </div>

          <StrategySelector selected={strategy} strategies={strategies} onChange={setStrategy} />

          <AdvancedSettingsPanel
            ticketCount={ticketCount}
            randomStrength={randomStrength}
            patternFilterStrength={patternFilterStrength}
            highReturnStrength={highReturnStrength}
            onTicketCountChange={setTicketCount}
            onRandomStrengthChange={setRandomStrength}
            onPatternFilterStrengthChange={setPatternFilterStrength}
            onHighReturnStrengthChange={setHighReturnStrength}
          />

          <RiskNotice>
            当選番号を予測保証するものではありません。過去データを使った参考分析として、無理のない範囲でお楽しみください。
          </RiskNotice>
        </div>

        <aside className="status-column">
          <CarryoverCard game={game} latestDraw={latest} />
          <BacktestSummaryCard game={game} summary={backtests[game]} />
        </aside>
      </section>

      <section className="ticket-section">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Analyzed Tickets</p>
            <h2>分析されたチケット</h2>
          </div>
          <span className="data-chip">{GAME_SPECS[game].label} / {ticketCount}口</span>
        </div>

        {tickets.length ? (
          <div className="ticket-grid">
            {tickets.map((ticket, index) => (
              <TicketCard
                ticket={ticket}
                index={index}
                key={`${ticket.strategy}-${index}-${ticket.numbers.join("-")}`}
                onNumberSelect={(score) => setSelectedNumber({ ticket, score })}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="データを読み込めませんでした" body="processedデータを生成すると、ここに参考買い目が表示されます。" />
        )}
      </section>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Trend Dashboard</p>
            <h2>過去傾向ダッシュボード</h2>
          </div>
        </div>
        <div className="insight-grid">
          <InsightCard title="出現頻度ランキング" value={stats.topFrequency} detail="全期間の本数字出現回数上位" accent="cyan" />
          <InsightCard title="直近トレンド" value={stats.recentTrend} detail="直近100回で目立つ数字" accent="emerald" />
          <InsightCard title="間隔ランキング" value={stats.deepGap} detail="前回出現からの空きが長い数字" accent="violet" />
          <InsightCard title="奇数偶数分布" value={stats.oddEven} detail="全期間の本数字ベース" accent="gold" />
          <InsightCard title="合計値レンジ" value={stats.sumRange} detail="25-75パーセンタイル" accent="cyan" />
          <InsightCard title="連番出現率" value={stats.consecutiveRate} detail="少なくとも1組の連番を含む回" accent="emerald" />
          <InsightCard title="前回重複平均" value={stats.previousOverlap} detail="前回本数字との平均重複数" accent="violet" />
          <InsightCard title="31超の出現傾向" value={stats.over31Rate} detail="31超を含む回の割合" accent="gold" />
        </div>
      </section>

      <NumberReasonPanel selected={selectedNumber} onClose={() => setSelectedNumber(null)} />
    </AppShell>
  );
}

function buildDashboardStats(draws: Draw[]) {
  if (!draws.length) {
    return {
      topFrequency: "-",
      recentTrend: "-",
      deepGap: "-",
      oddEven: "-",
      sumRange: "-",
      consecutiveRate: "-",
      previousOverlap: "-",
      over31Rate: "-"
    };
  }
  const counts = new Map<number, number>();
  const recentCounts = new Map<number, number>();
  const recent = draws.slice(-100);
  const lastSeen = new Map<number, number>();
  const allNumbers = draws.flatMap((draw) => draw.mainNumbers);
  const maxNumber = Math.max(...allNumbers);

  for (const draw of draws) {
    for (const number of draw.mainNumbers) {
      counts.set(number, (counts.get(number) ?? 0) + 1);
      lastSeen.set(number, draw.drawNumber);
    }
  }
  for (const draw of recent) {
    for (const number of draw.mainNumbers) {
      recentCounts.set(number, (recentCounts.get(number) ?? 0) + 1);
    }
  }

  const topFrequency = topEntries(counts, 3).map(([number, count]) => `${pad(number)} (${count})`).join(" / ");
  const recentTrend = topEntries(recentCounts, 3).map(([number, count]) => `${pad(number)} (${count})`).join(" / ");
  const latestDrawNumber = draws.at(-1)?.drawNumber ?? 0;
  const deepGap = Array.from({ length: maxNumber }, (_, index) => index + 1)
    .map((number) => [number, latestDrawNumber - (lastSeen.get(number) ?? 0)] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([number, gap]) => `${pad(number)} (${gap})`)
    .join(" / ");
  const odd = allNumbers.filter((number) => number % 2 === 1).length;
  const even = allNumbers.length - odd;
  const sums = draws.map((draw) => draw.mainNumbers.reduce((sum, number) => sum + number, 0)).sort((a, b) => a - b);
  const q1 = sums[Math.floor(sums.length * 0.25)];
  const q3 = sums[Math.floor(sums.length * 0.75)];
  const consecutiveRate = draws.filter((draw) => draw.mainNumbers.some((number, index, arr) => index > 0 && number === arr[index - 1] + 1)).length / draws.length;
  const overlap = draws.slice(1).map((draw, index) => draw.mainNumbers.filter((number) => draws[index].mainNumbers.includes(number)).length);
  const over31Rate = draws.filter((draw) => draw.mainNumbers.some((number) => number > 31)).length / draws.length;

  return {
    topFrequency,
    recentTrend,
    deepGap,
    oddEven: `${Math.round((odd / allNumbers.length) * 100)}% / ${Math.round((even / allNumbers.length) * 100)}%`,
    sumRange: `${q1}-${q3}`,
    consecutiveRate: `${Math.round(consecutiveRate * 100)}%`,
    previousOverlap: (overlap.reduce((sum, value) => sum + value, 0) / Math.max(1, overlap.length)).toFixed(2),
    over31Rate: `${Math.round(over31Rate * 100)}%`
  };
}

function topEntries(map: Map<number, number>, count: number): Array<[number, number]> {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, count);
}

function pad(number: number): string {
  return number.toString().padStart(2, "0");
}
