import { formatYen, padNumber } from "@/loto/format";
import type { Draw } from "@/loto/types";

export default function LatestDrawCard({ draw }: { draw: Draw | null }) {
  if (!draw) {
    return <div className="analysis-card">データがありません。</div>;
  }
  return (
    <article className="analysis-card latest-draw-card">
      <div>
        <span className="card-kicker">最新結果</span>
        <h2>第{draw.drawNumber.toLocaleString("ja-JP")}回</h2>
        <p>抽せん日: {draw.drawDate}</p>
      </div>
      <div className="number-list">
        {draw.mainNumbers.map((number) => (
          <span key={number}>{padNumber(number)}</span>
        ))}
      </div>
      <dl className="definition-grid">
        <div>
          <dt>ボーナス数字</dt>
          <dd>{draw.bonusNumbers.map(padNumber).join(" / ")}</dd>
        </div>
        <div>
          <dt>販売実績額</dt>
          <dd>{formatYen(draw.salesAmount)}</dd>
        </div>
        <div>
          <dt>キャリーオーバー</dt>
          <dd>{formatYen(draw.carryoverAmount)}</dd>
        </div>
      </dl>
    </article>
  );
}
