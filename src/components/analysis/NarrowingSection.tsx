import HowToReadBox from "@/components/analysis/HowToReadBox";
import { GAME_SPECS } from "@/loto/constants";
import type { TrendData } from "@/loto/trends";

const pad = (value: number) => String(value).padStart(2, "0");

export default function NarrowingSection({ data }: { data: TrendData }) {
  const { narrowing, game } = data;
  const spec = GAME_SPECS[game];
  const [, stats50] = data.stats;
  const selected = [...narrowing.selected].sort((a, b) => a.number - b.number);
  const removed = [...narrowing.removed].sort((a, b) => a.number - b.number);
  const topPatterns = [...stats50.patternDistribution].sort((a, b) => b.count - a.count).slice(0, 3);
  const topOdd = [...stats50.oddCountDistribution].sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <section className="analysis-section" id="narrowing">
      <h2>絞り込み参考 (第{narrowing.targetDrawNumber}回向け・{narrowing.limit}数字)</h2>
      <HowToReadBox>
        傾向表の偏り (組の不足、未出現、直近の出方) と本サイトの数理スコアを合わせて、{spec.maxNumber}個の数字を{narrowing.limit}個以内に絞った参考リストです。
        どの数字も出る確率は同じであり、外した数字が出ないという意味ではありません。口の散らし方を決めるための目安としてご利用ください。
      </HowToReadBox>

      <div className="narrowing-grid">
        <article className="analysis-card narrowing-card">
          <span className="card-kicker">残した数字 {selected.length}個 (奇数{narrowing.selectedOddCount}個・偶数{selected.length - narrowing.selectedOddCount}個)</span>
          <div className="number-list narrow-list">
            {selected.map((entry) => (
              <span key={entry.number} className={entry.inPreviousDraw ? "prev" : ""} title={entry.tags.join(" / ") || "スコア上位"}>
                {pad(entry.number)}
              </span>
            ))}
          </div>
          <p className="narrow-line">{selected.map((entry) => pad(entry.number)).join(" ")}</p>
          <dl className="definition-grid">
            <div>
              <dt>6分割の内訳</dt>
              <dd>{Object.entries(narrowing.selectedByGroup6).map(([key, value]) => `${key}${value}`).join(" ")}</dd>
            </div>
            <div>
              <dt>{data.groupFineLabel}の内訳</dt>
              <dd>{Object.entries(narrowing.selectedByGroupFine).map(([key, value]) => `${key}:${value}`).join(" ")}</dd>
            </div>
          </dl>
        </article>

        <article className="analysis-card narrowing-card removed">
          <span className="card-kicker">削除数字 {removed.length}個 (今回は優先度を下げた数字)</span>
          <div className="number-list narrow-list">
            {removed.map((entry) => (
              <span key={entry.number} className="muted" title={entry.tags.join(" / ") || "スコア下位"}>
                {pad(entry.number)}
              </span>
            ))}
          </div>
          <ul className="friendly-list compact">
            {removed.map((entry) => (
              <li key={entry.number}>
                <strong>{pad(entry.number)}</strong> {entry.group6}組 / 直近50回 {entry.recent50}回 / 未出現{entry.gap}回{entry.tags.filter((tag) => !tag.startsWith("未出現")).length ? ` / ${entry.tags.filter((tag) => !tag.startsWith("未出現")).join("・")}` : ""}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="summary-grid">
        <article className="analysis-card">
          <h3>絞り込みの手順</h3>
          <ol className="friendly-list">
            <li>数理コア (頻度の検定・未出現・人気度回帰) の「おまかせミックス」スコアを土台にする。</li>
            <li>傾向表の読み: 直近50回のホット度、未出現10回以上、6分割と{data.groupFineLabel}の組不足、直近12回の空組回数を soft signal として加点。前回本数字は減点。</li>
            {narrowing.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
        <article className="analysis-card">
          <h3>傾向表から読める形 (直近50回)</h3>
          <dl className="definition-grid">
            <div>
              <dt>当せんパターン上位</dt>
              <dd>{topPatterns.map((entry) => `${entry.label} ${entry.count}回`).join(" / ")}</dd>
            </div>
            <div>
              <dt>奇数の個数 上位</dt>
              <dd>{topOdd.map((entry) => `${entry.label} ${entry.count}回`).join(" / ")}</dd>
            </div>
            <div>
              <dt>組別の出現 / 期待値</dt>
              <dd>{data.group6.map((def) => `${def.key} ${stats50.group6Totals[def.key]}/${stats50.group6Expected[def.key]}`).join(" ")}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="analysis-subsection">
        <div className="section-heading compact">
          <h3>絞り込んだ数字だけで組んだ参考{narrowing.sampleTickets.length}口</h3>
          <p>同じ組から3個以上入れない、奇数偶数を寄せすぎない、前回本数字は1口1個まで、という条件で機械的に組んだものです。赤は前回の本数字。</p>
        </div>
        <div className="ticket-grid">
          {narrowing.sampleTickets.map((ticket, index) => (
            <article key={index} className="analysis-card ticket-card">
              <span className="card-kicker">{index + 1}口目 ・ {ticket.note}</span>
              <div className="inline-number-list">
                {ticket.numbers.map((number) => (
                  <span key={number} className={selected.find((entry) => entry.number === number)?.inPreviousDraw ? "prev" : ""}>{pad(number)}</span>
                ))}
              </div>
              <p className="soft-note">6組 {ticket.group6Code} / 合計 {ticket.sum} / 奇数 {ticket.oddCount}個</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
