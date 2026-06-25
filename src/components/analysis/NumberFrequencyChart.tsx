import { padNumber } from "@/loto/format";
import type { NumberAnalysis } from "@/loto/analysis";

export default function NumberFrequencyChart({ rows }: { rows: NumberAnalysis[] }) {
  const max = Math.max(1, ...rows.map((row) => row.totalFrequency));
  return (
    <div className="bar-chart" aria-label="数字別出現回数グラフ">
      {rows.map((row) => (
        <div className="bar-row" key={row.number}>
          <span>数字 {padNumber(row.number)}</span>
          <i>
            <b style={{ width: `${(row.totalFrequency / max) * 100}%` }} />
          </i>
          <strong>{row.totalFrequency.toLocaleString("ja-JP")}回</strong>
        </div>
      ))}
    </div>
  );
}
