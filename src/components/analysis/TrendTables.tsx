"use client";

import { useMemo, useState } from "react";
import type { GroupDef, TrendData, TrendRow } from "@/loto/trends";
import { GAME_SPECS } from "@/loto/constants";

type Tab = "grid" | "group6" | "fine" | "ranking";
type Range = 10 | 50 | 100;

const SYMBOLS = ["", "●", "◎", "★", "☆", "◆", "■", "▲"];
const pad = (value: number) => String(value).padStart(2, "0");

function groupKey(defs: GroupDef[], number: number) {
  return defs.find((def) => number >= def.from && number <= def.to)?.key ?? "";
}

export default function TrendTables({ data }: { data: TrendData }) {
  const [tab, setTab] = useState<Tab>("grid");
  const [range, setRange] = useState<Range>(50);
  const spec = GAME_SPECS[data.game];
  const rows = useMemo(() => data.rows.slice(0, range), [data.rows, range]);
  const gaps = data.stats[0].currentGaps;

  const tabs: Array<[Tab, string]> = [
    ["grid", "全数字出目表 ●○"],
    ["group6", "6分割傾向表"],
    ["fine", `${data.groupFineLabel}傾向表`],
    ["ranking", "集計表"]
  ];

  return (
    <div className="trend-block">
      <div className="trend-controls">
        <div className="trend-tabs" role="tablist" aria-label="傾向表の種類">
          {tabs.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="trend-range" role="group" aria-label="表示範囲">
          {[10, 50, 100].map((value) => (
            <button key={value} type="button" aria-pressed={range === value} onClick={() => setRange(value as Range)}>
              最新{value}回
            </button>
          ))}
        </div>
      </div>

      {tab === "grid" && <NumberGrid rows={rows} maxNumber={spec.maxNumber} mainCount={spec.mainCount} group6={data.group6} gaps={gaps} />}
      {tab === "group6" && <GroupTable rows={rows} defs={data.group6} mode="group6" mainCount={spec.mainCount} maxNumber={spec.maxNumber} />}
      {tab === "fine" && <GroupTable rows={rows} defs={data.groupFine} mode="fine" mainCount={spec.mainCount} maxNumber={spec.maxNumber} />}
      {tab === "ranking" && <RankingTable data={data} />}
    </div>
  );
}

function NumberGrid({ rows, maxNumber, mainCount, group6, gaps }: { rows: TrendRow[]; maxNumber: number; mainCount: number; group6: GroupDef[]; gaps: number[] }) {
  const numbers = Array.from({ length: maxNumber }, (_, index) => index + 1);
  const mainCounts = numbers.map((number) => rows.filter((row) => row.main.includes(number)).length);
  const bonusCounts = numbers.map((number) => rows.filter((row) => row.bonus.includes(number)).length);
  const expected = (rows.length * mainCount) / maxNumber;
  const starts = new Set(group6.map((def) => def.from));
  return (
    <>
      <p className="trend-legend">
        <span><b className="sym-main">●</b> 本数字</span>
        <span><b className="sym-bonus">○</b> ボーナス数字</span>
        <span>下段: 表示範囲の出現回数 (期待値 {expected.toFixed(1)}) / ボーナス回数 / 直近の未出現回数</span>
        <span><b className="hot">橙</b>=期待値×1.25以上 <b className="cold">青</b>=×0.75以下・未出現10回以上</span>
      </p>
      <div className="table-scroll trend-scroll">
        <table className="trend-table">
          <thead>
            <tr>
              <th className="sticky-col">回</th>
              {numbers.map((number) => (
                <th key={number} className={starts.has(number) ? "group-start" : ""}>{pad(number)}</th>
              ))}
              <th>奇数</th>
              <th>合計</th>
            </tr>
            <tr>
              <th className="sticky-col">6組</th>
              {group6.map((def) => (
                <th key={def.key} colSpan={def.to - def.from + 1} className="group-start group-label">{def.key}</th>
              ))}
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.drawNumber} className={index % 10 === 9 ? "sep" : ""}>
                <th className="sticky-col">{row.drawNumber}</th>
                {numbers.map((number) => {
                  const isMain = row.main.includes(number);
                  const isBonus = row.bonus.includes(number);
                  return (
                    <td key={number} className={`${isMain ? "cell-main" : isBonus ? "cell-bonus" : ""} ${starts.has(number) ? "group-start" : ""}`}>
                      {isMain ? "●" : isBonus ? "○" : ""}
                    </td>
                  );
                })}
                <td className="num">{row.oddCount}</td>
                <td className="num">{row.sum}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="sticky-col">本数字</th>
              {numbers.map((number, index) => (
                <td key={number} className={`num ${mainCounts[index] >= expected * 1.25 ? "hot" : mainCounts[index] <= expected * 0.75 ? "cold" : ""}`}>{mainCounts[index]}</td>
              ))}
              <td />
              <td />
            </tr>
            <tr>
              <th className="sticky-col">ボーナス</th>
              {numbers.map((number, index) => (
                <td key={number} className="num">{bonusCounts[index]}</td>
              ))}
              <td />
              <td />
            </tr>
            <tr>
              <th className="sticky-col">未出現</th>
              {numbers.map((number) => (
                <td key={number} className={`num ${gaps[number] >= 10 ? "cold" : ""}`}>{gaps[number]}</td>
              ))}
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

function GroupTable({ rows, defs, mode, mainCount, maxNumber }: { rows: TrendRow[]; defs: GroupDef[]; mode: "group6" | "fine"; mainCount: number; maxNumber: number }) {
  const withBonus = mode === "group6";
  const totals = Object.fromEntries(defs.map((def) => [def.key, 0])) as Record<string, number>;
  const empties = Object.fromEntries(defs.map((def) => [def.key, 0])) as Record<string, number>;
  for (const row of rows) {
    for (const def of defs) {
      const count = row.main.filter((number) => number >= def.from && number <= def.to).length;
      totals[def.key] += count;
      if (count === 0) empties[def.key] += 1;
    }
  }
  const perNumber = (rows.length * mainCount) / maxNumber;
  return (
    <>
      <p className="trend-legend">
        <span>組: {defs.map((def) => `${def.key}:${pad(def.from)}-${pad(def.to)}`).join(" / ")}{withBonus ? " (本数字＋ボーナス)" : " (本数字のみ)"}</span>
        <span><b>●</b>1個 <b>◎</b>2個 <b>★</b>3個 <b>☆</b>4個 <b>◆</b>5個</span>
        {withBonus ? <span>当せんパターン: 同じ組に何個入ったかの形 (フルハウス=3-2、ツーペア=2-2 など)</span> : <span>「空組」は本数字が1つも入らなかった組</span>}
      </p>
      <div className="table-scroll trend-scroll">
        <table className="trend-table group-table">
          <thead>
            <tr>
              <th className="sticky-col">回</th>
              <th>本数字</th>
              <th>B数字</th>
              <th>当せん枠</th>
              {defs.map((def) => (
                <th key={def.key}>{def.key}</th>
              ))}
              {withBonus ? <th>当せんパターン</th> : <th>空組</th>}
              <th>奇数</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const counts = withBonus ? row.group6Counts : row.groupFineCounts;
              return (
                <tr key={row.drawNumber} className={index % 10 === 9 ? "sep" : ""}>
                  <th className="sticky-col">{row.drawNumber}</th>
                  <td className="nums">{row.main.map(pad).join(" ")}</td>
                  <td className="nums bonus">{row.bonus.map(pad).join(" ")}</td>
                  <td className="code">{withBonus ? row.group6Code : row.groupFineCode}</td>
                  {defs.map((def) => {
                    const value = counts[def.key] ?? 0;
                    return (
                      <td key={def.key} className={value ? `sym c${Math.min(value, 5)}` : "sym"}>{SYMBOLS[value] ?? value}</td>
                    );
                  })}
                  {withBonus ? (
                    <td className="code">{row.group6Pattern}</td>
                  ) : (
                    <td className="code">{defs.filter((def) => !(row.groupFineCounts[def.key] > 0)).map((def) => def.key).join(",") || "－"}</td>
                  )}
                  <td className="num">{row.oddCount}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th className="sticky-col" colSpan={4}>本数字の出現数 / 期待値</th>
              {defs.map((def) => {
                const expected = perNumber * (def.to - def.from + 1);
                return (
                  <td key={def.key} className={`num ${totals[def.key] >= expected * 1.15 ? "hot" : totals[def.key] <= expected * 0.85 ? "cold" : ""}`}>
                    {totals[def.key]}
                    <br />
                    <small>{expected.toFixed(0)}</small>
                  </td>
                );
              })}
              <td />
              <td />
            </tr>
            <tr>
              <th className="sticky-col" colSpan={4}>その組が空だった回数</th>
              {defs.map((def) => (
                <td key={def.key} className="num">{empties[def.key]}</td>
              ))}
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

function RankingTable({ data }: { data: TrendData }) {
  const [statsAll, stats50, stats10] = data.stats;
  const numbers = Array.from({ length: GAME_SPECS[data.game].maxNumber }, (_, index) => index + 1);
  const max = Math.max(...numbers.map((number) => statsAll.mainCounts[number]));
  return (
    <>
      <p className="trend-legend">
        <span>本数字として出た回数を多い順に並べた集計表です。出た回数が多い数字が次も出やすいわけではありません。</span>
      </p>
      <div className="ranking-grid">
        {[statsAll, stats50, stats10].map((stats) => (
          <article key={stats.range} className="analysis-card">
            <h3>{stats.range === "all" ? `全${stats.drawCount}回` : `最新${stats.range}回`} <small>(期待値 {stats.expectedPerNumber}回/数字)</small></h3>
            <div className="table-scroll">
              <table className="data-table ranking-table">
                <thead>
                  <tr>
                    <th>出現回数</th>
                    <th>当せん数字</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.frequencyRanking.map((entry) => (
                    <tr key={entry.count}>
                      <td className="num">{entry.count}回</td>
                      <td className="nums">{entry.numbers.map(pad).join(" ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
      <div className="freq-bars" aria-label="全回の数字別出現回数グラフ">
        {numbers.map((number) => (
          <div key={number} className="freq-bar">
            <div className="bar" style={{ height: `${(statsAll.mainCounts[number] / max) * 100}%` }} title={`${pad(number)}: ${statsAll.mainCounts[number]}回`} />
            <small>{pad(number)}</small>
          </div>
        ))}
      </div>
    </>
  );
}
