import { formatYen, padNumber } from "@/loto/format";
import type { Draw } from "@/loto/types";

export default function RecentDrawsTable({ draws }: { draws: Draw[] }) {
  if (!draws.length) {
    return <div className="analysis-card">表示できる当せんデータがありません。</div>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>回号</th>
            <th>抽せん日</th>
            <th>本数字</th>
            <th>ボーナス数字</th>
            <th>販売実績額</th>
            <th>キャリーオーバー</th>
          </tr>
        </thead>
        <tbody>
          {draws.map((draw) => (
            <tr key={draw.drawNumber}>
              <td>第{draw.drawNumber.toLocaleString("ja-JP")}回</td>
              <td>{draw.drawDate}</td>
              <td>
                <span className="inline-number-list">
                  {draw.mainNumbers.map((number) => (
                    <span key={number}>{padNumber(number)}</span>
                  ))}
                </span>
              </td>
              <td>{draw.bonusNumbers.length ? draw.bonusNumbers.map(padNumber).join(" / ") : "なし"}</td>
              <td>{formatYen(draw.salesAmount)}</td>
              <td>{formatYen(draw.carryoverAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
