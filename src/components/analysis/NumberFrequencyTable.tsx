import { padNumber } from "@/loto/format";
import type { NumberAnalysis } from "@/loto/analysis";

export default function NumberFrequencyTable({ rows, limit }: { rows: NumberAnalysis[]; limit?: number }) {
  const displayRows = [...rows].sort((a, b) => b.totalFrequency - a.totalFrequency || a.number - b.number).slice(0, limit ?? rows.length);
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>数字</th>
            <th>全期間の出現回数</th>
            <th>直近100回</th>
            <th>前回からの間隔</th>
            <th>最後に出た回号</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.number}>
              <td>数字 {padNumber(row.number)}</td>
              <td>{row.totalFrequency.toLocaleString("ja-JP")}回</td>
              <td>{row.recent100Frequency.toLocaleString("ja-JP")}回</td>
              <td>{row.lastSeenGap.toLocaleString("ja-JP")}回</td>
              <td>{row.lastSeenDraw ? `第${row.lastSeenDraw.toLocaleString("ja-JP")}回` : "未出現"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
