import { padNumber } from "@/loto/format";
import type { NumberAnalysis } from "@/loto/analysis";

export default function GapRankingTable({ rows }: { rows: NumberAnalysis[] }) {
  const displayRows = [...rows].sort((a, b) => b.lastSeenGap - a.lastSeenGap || a.number - b.number).slice(0, 15);
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>順位</th>
            <th>数字</th>
            <th>前回からの間隔</th>
            <th>平均出現間隔</th>
            <th>最大未出現間隔</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => (
            <tr key={row.number}>
              <td>{index + 1}位</td>
              <td>数字 {padNumber(row.number)}</td>
              <td>{row.lastSeenGap.toLocaleString("ja-JP")}回</td>
              <td>{row.averageGap ? `${row.averageGap.toFixed(1)}回` : "未計算"}</td>
              <td>{row.maxGap ? `${row.maxGap.toLocaleString("ja-JP")}回` : "未計算"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
