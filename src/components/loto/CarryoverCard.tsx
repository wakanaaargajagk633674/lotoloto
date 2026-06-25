import { GAME_SPECS } from "@/loto/constants";
import type { Draw, GameType } from "@/loto/types";

export default function CarryoverCard({ game, latestDraw }: { game: GameType; latestDraw?: Draw }) {
  return (
    <article className="status-card carryover-card">
      <span>{GAME_SPECS[game].label} キャリーオーバー</span>
      <strong>{(latestDraw?.carryoverAmount ?? 0).toLocaleString("ja-JP")}円</strong>
      <small>当たりやすさではなく、販売状況と分配条件を見るための参考情報です。</small>
    </article>
  );
}
