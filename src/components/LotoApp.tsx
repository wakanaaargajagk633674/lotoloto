"use client";

import { useMemo, useState } from "react";
import AdvancedSettingsPanel from "@/components/loto/AdvancedSettingsPanel";
import BacktestThinkingSection from "@/components/loto/BacktestThinkingSection";
import DataInsightSection, { type DataInsightStats } from "@/components/loto/DataInsightSection";
import EmptyState from "@/components/loto/EmptyState";
import FriendlyHeroSection from "@/components/loto/FriendlyHeroSection";
import FriendlyReasonPanel, { type SelectedNumberInsight } from "@/components/loto/FriendlyReasonPanel";
import FriendlyStrategyCard from "@/components/loto/FriendlyStrategyCard";
import GentleTicketCard from "@/components/loto/GentleTicketCard";
import LightAppShell from "@/components/loto/LightAppShell";
import ResponsibleNotice from "@/components/loto/ResponsibleNotice";
import { GAME_SPECS } from "@/loto/constants";
import { generateTickets } from "@/loto/generator";
import { listStrategies } from "@/loto/strategies";
import type { BacktestSummary, CandidateTuningMode, Draw, GameType, PredictionTicket, StrategyType } from "@/loto/types";

type Props = {
  initialDraws: Record<GameType, Draw[]>;
  backtests: Partial<Record<GameType, BacktestSummary>>;
};

export default function LotoApp({ initialDraws, backtests }: Props) {
  const [game, setGame] = useState<GameType>("loto6");
  const [strategy, setStrategy] = useState<StrategyType>("balance");
  const [ticketCount, setTicketCount] = useState(5);
  const [seed, setSeed] = useState(20260625);
  const [randomStrength, setRandomStrength] = useState(55);
  const [patternFilterStrength, setPatternFilterStrength] = useState(45);
  const [highReturnStrength, setHighReturnStrength] = useState(60);
  const [selectedNumber, setSelectedNumber] = useState<SelectedNumberInsight>(null);

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
    <LightAppShell>
      <FriendlyHeroSection
        game={game}
        drawCount={initialDraws[game].length}
        latestDraw={latest}
        onGameChange={setGame}
        onStart={() => document.getElementById("simple-settings")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />

      <section className="simple-settings-section" id="simple-settings">
        <div className="section-heading">
          <p className="section-label">かんたん設定</p>
          <h2>ロトと分析タイプを選ぶだけ。</h2>
          <p>難しい設定はあとから開けます。まずは気になる見方を選んで、参考買い目を見てください。</p>
        </div>

        <div className="simple-control-row">
          <label className="ticket-count-control">
            <span>作る買い目の数</span>
            <input
              type="number"
              min={1}
              max={20}
              value={ticketCount}
              onChange={(event) => setTicketCount(Math.max(1, Math.min(20, Number(event.target.value))))}
            />
            <small>購入する場合は、口数に応じて金額が増えます。</small>
          </label>
          <button className="primary-action" type="button" onClick={() => setSeed((value) => value + 1)}>
            参考買い目を作る
          </button>
        </div>

        <div className="friendly-strategy-grid" aria-label="分析タイプ">
          {strategies.map((item) => (
            <FriendlyStrategyCard key={item.value} strategy={item} selected={strategy === item.value} onSelect={() => setStrategy(item.value)} />
          ))}
        </div>

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
      </section>

      <section className="ticket-section">
        <div className="section-heading">
          <p className="section-label">参考買い目</p>
          <h2>{GAME_SPECS[game].label} の参考買い目</h2>
          <p>数字ボールを押すと、その数字を入れた理由を確認できます。</p>
        </div>

        {tickets.length ? (
          <div className="ticket-grid">
            {tickets.map((ticket, index) => (
              <GentleTicketCard
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

      <FriendlyReasonPanel selected={selectedNumber} />
      <DataInsightSection stats={stats} />
      <ResponsibleNotice />
      <BacktestThinkingSection backtest={backtests[game]} />
    </LightAppShell>
  );
}

function buildDashboardStats(draws: Draw[]): DataInsightStats {
  if (!draws.length) {
    return {
      topFrequency: [],
      recentTrend: [],
      longestGap: [],
      oddPercent: 0,
      evenPercent: 0,
      sumRange: "-",
      consecutiveRate: 0,
      previousOverlapAverage: "0.00",
      over31Rate: 0
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

  const latestDrawNumber = draws.at(-1)?.drawNumber ?? 0;
  const longestGap = Array.from({ length: maxNumber }, (_, index) => index + 1)
    .map((number) => [number, latestDrawNumber - (lastSeen.get(number) ?? 0)] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([number, value], index) => ({ rank: index + 1, number, value }));
  const odd = allNumbers.filter((number) => number % 2 === 1).length;
  const even = allNumbers.length - odd;
  const sums = draws.map((draw) => draw.mainNumbers.reduce((sum, number) => sum + number, 0)).sort((a, b) => a - b);
  const q1 = sums[Math.floor(sums.length * 0.25)];
  const q3 = sums[Math.floor(sums.length * 0.75)];
  const consecutiveRate = draws.filter((draw) => draw.mainNumbers.some((number, index, arr) => index > 0 && number === arr[index - 1] + 1)).length / draws.length;
  const overlap = draws.slice(1).map((draw, index) => draw.mainNumbers.filter((number) => draws[index].mainNumbers.includes(number)).length);
  const over31Rate = draws.filter((draw) => draw.mainNumbers.some((number) => number > 31)).length / draws.length;

  return {
    topFrequency: toRankedMetrics(counts),
    recentTrend: toRankedMetrics(recentCounts),
    longestGap,
    oddPercent: Math.round((odd / allNumbers.length) * 100),
    evenPercent: Math.round((even / allNumbers.length) * 100),
    sumRange: `${q1} から ${q3}`,
    consecutiveRate: Math.round(consecutiveRate * 100),
    previousOverlapAverage: (overlap.reduce((sum, value) => sum + value, 0) / Math.max(1, overlap.length)).toFixed(2),
    over31Rate: Math.round(over31Rate * 100)
  };
}

function toRankedMetrics(map: Map<number, number>) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([number, value], index) => ({ rank: index + 1, number, value }));
}
