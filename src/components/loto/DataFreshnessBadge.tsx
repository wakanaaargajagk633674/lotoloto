import type { Draw } from "@/loto/types";

export default function DataFreshnessBadge({ latestDraw }: { latestDraw?: Draw }) {
  return (
    <span className="freshness-badge">
      <i />
      {latestDraw ? `最新データ ${latestDraw.drawDate}` : "データ未読込"}
    </span>
  );
}
