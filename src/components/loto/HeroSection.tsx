import DataFreshnessBadge from "@/components/loto/DataFreshnessBadge";
import GameToggle from "@/components/loto/GameToggle";
import { GAME_SPECS } from "@/loto/constants";
import type { Draw, GameType } from "@/loto/types";

type Props = {
  game: GameType;
  latestDraw?: Draw;
  onGameChange: (game: GameType) => void;
  onStart: () => void;
};

export default function HeroSection({ game, latestDraw, onGameChange, onStart }: Props) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="section-kicker">LOTOLOTO Intelligence</p>
        <h1>過去データから、数字の流れを読み解く。</h1>
        <p>
          ロト6・ロト7の過去抽選データをもとに、頻度、間隔、バランス、人気回避傾向を分析し、
          参考買い目を生成します。
        </p>
        <div className="hero-actions">
          <button className="primary-action" type="button" onClick={onStart}>
            参考予想を始める
          </button>
          <DataFreshnessBadge latestDraw={latestDraw} />
        </div>
        <p className="hero-disclaimer">
          当選番号を予測保証するものではありません。過去データを使った参考分析としてお楽しみください。
        </p>
      </div>
      <div className="hero-console">
        <GameToggle value={game} onChange={onGameChange} />
        <div className="analysis-status">
          <span>今日の分析ステータス</span>
          <strong>{latestDraw ? `${GAME_SPECS[game].label} 第${latestDraw.drawNumber}回まで同期` : "データ未読込"}</strong>
        </div>
        <div className="carryover-strip">
          <span>Carryover</span>
          <strong>{(latestDraw?.carryoverAmount ?? 0).toLocaleString("ja-JP")}円</strong>
        </div>
      </div>
    </section>
  );
}
