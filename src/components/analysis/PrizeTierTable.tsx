import { formatYen } from "@/loto/format";
import type { LotoAnalysis } from "@/loto/analysis";

export default function PrizeTierTable({ analysis }: { analysis: LotoAnalysis }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>等級</th>
            <th>平均当せん金額</th>
            <th>最大当せん金額</th>
            <th>平均当せん口数</th>
          </tr>
        </thead>
        <tbody>
          {analysis.prizeStats.map((row) => (
            <tr key={row.tier}>
              <td>{row.tier}等</td>
              <td>{formatYen(row.averagePrizeYen ? Math.round(row.averagePrizeYen) : null)}</td>
              <td>{formatYen(row.maxPrizeYen)}</td>
              <td>{row.averageWinners ? `${row.averageWinners.toFixed(1)}口` : "未取得"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
