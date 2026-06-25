import { formatPercent } from "@/loto/format";
import type { DistributionRow } from "@/loto/analysis";

export default function DistributionList({ title, rows }: { title: string; rows: DistributionRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <article className="analysis-card">
      <h3>{title}</h3>
      <div className="bar-chart compact">
        {rows.map((row) => (
          <div className="bar-row" key={row.label}>
            <span>{row.label}</span>
            <i>
              <b style={{ width: `${(row.count / max) * 100}%` }} />
            </i>
            <strong>
              {row.count.toLocaleString("ja-JP")}回 / {formatPercent(row.rate)}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}
