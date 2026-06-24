"use client";

import { useMemo, useState } from "react";
import { GAME_SPECS, STRATEGY_LABELS } from "@/loto/constants";
import { generateTickets } from "@/loto/generator";
import { listStrategies } from "@/loto/strategies";
import type { Draw, GameType, PredictionTicket, StrategyType } from "@/loto/types";

type Props = {
  initialDraws: Record<GameType, Draw[]>;
};

export default function LotoApp({ initialDraws }: Props) {
  const [game, setGame] = useState<GameType>("loto6");
  const [strategy, setStrategy] = useState<StrategyType>("balance");
  const [ticketCount, setTicketCount] = useState(5);
  const [seed, setSeed] = useState(20260625);

  const tickets = useMemo<PredictionTicket[]>(() => {
    const draws = initialDraws[game];
    if (!draws.length) {
      return [];
    }
    return generateTickets(draws, { game, strategy, ticketCount, seed, deletionMode: strategy === "sougaku_delete" ? "strong" : "weak" });
  }, [game, initialDraws, seed, strategy, ticketCount]);

  const latest = initialDraws[game].at(-1);
  const strategies = listStrategies();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <strong>LotoLoto</strong>
            <span>説明可能な参考買い目ジェネレーター</span>
          </div>
          <span className="muted">
            {latest ? `${GAME_SPECS[game].label} 第${latest.drawNumber}回まで反映` : "データ未読込"}
          </span>
        </div>
      </header>

      <main className="main">
        <section className="control-band" aria-label="予想設定">
          <div className="field">
            <label htmlFor="game">くじ種</label>
            <select id="game" value={game} onChange={(event) => setGame(event.target.value as GameType)}>
              <option value="loto6">ロト6</option>
              <option value="loto7">ロト7</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="strategy">予想タイプ</label>
            <select id="strategy" value={strategy} onChange={(event) => setStrategy(event.target.value as StrategyType)}>
              {strategies.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ticket-count">口数</label>
            <input
              id="ticket-count"
              type="number"
              min={1}
              max={20}
              value={ticketCount}
              onChange={(event) => setTicketCount(Math.max(1, Math.min(20, Number(event.target.value))))}
            />
          </div>
          <button className="generate" type="button" onClick={() => setSeed((value) => value + 1)}>
            再生成
          </button>
        </section>

        <div className="content-grid">
          <section className="section">
            <h2>予想結果</h2>
            <div className="ticket-list">
              {tickets.map((ticket, index) => (
                <article className="ticket" key={`${ticket.strategy}-${index}-${ticket.numbers.join("-")}`}>
                  <strong>
                    {index + 1}口目 / {STRATEGY_LABELS[ticket.strategy]}
                  </strong>
                  <div className="numbers">
                    {ticket.numbers.map((number) => (
                      <span className="ball" key={number}>
                        {number.toString().padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <div className="metrics">
                    <Metric label="組み合わせ" value={ticket.totalScore.toFixed(2)} />
                    <Metric label="バランス" value={(ticket.combinationScores.balanceScore * 100).toFixed(0)} />
                    <Metric label="人気回避" value={(ticket.combinationScores.popularityAvoidanceScore * 100).toFixed(0)} />
                    <Metric label="削除リスク" value={(ticket.combinationScores.deletionRiskScore * 100).toFixed(0)} />
                  </div>
                  <ul className="explanations">
                    {ticket.explanations.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                  <p className="notice">{ticket.disclaimer}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="section">
            <h2>過去傾向</h2>
            <div className="dashboard">
              <Metric label="収録回数" value={`${initialDraws[game].length}回`} />
              <Metric label="1口価格" value={`${GAME_SPECS[game].ticketPriceYen}円`} />
              <Metric label="1等理論確率" value={`1 / ${GAME_SPECS[game].firstPrizeOdds.toLocaleString("ja-JP")}`} />
              <Metric label="最新キャリー" value={`${(latest?.carryoverAmount ?? 0).toLocaleString("ja-JP")}円`} />
            </div>
            <h3>予想タイプ</h3>
            <table className="table">
              <tbody>
                {strategies.map((item) => (
                  <tr key={item.value}>
                    <th>{item.label}</th>
                    <td>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="notice">購入予算を決め、当せん保証や回収保証として使わないでください。</p>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
