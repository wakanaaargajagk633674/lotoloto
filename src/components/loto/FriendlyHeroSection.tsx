import GameTypeTabs from "@/components/loto/GameTypeTabs";
import MetricWithLabel from "@/components/loto/MetricWithLabel";
import SimpleStepGuide from "@/components/loto/SimpleStepGuide";
import { GAME_SPECS } from "@/loto/constants";
import type { Draw, GameType } from "@/loto/types";

type Props = {
  game: GameType;
  drawCount: number;
  latestDraw?: Draw;
  onGameChange: (game: GameType) => void;
  onStart: () => void;
};

export default function FriendlyHeroSection({ game, drawCount, latestDraw, onGameChange, onStart }: Props) {
  const latestDate = latestDraw?.drawDate ? new Date(latestDraw.drawDate).toLocaleDateString("ja-JP") : "未取得";
  return (
    <section className="friendly-hero">
      <div className="friendly-hero-copy">
        <p className="section-label">LOTOLOTO Light Insight</p>
        <h1>ロト6ロト7の数字を、やさしく分析。</h1>
        <p>
          過去の抽選データをもとに、出現回数、間隔、バランスを整理し、
          参考買い目をわかりやすく表示します。
        </p>
        <div className="friendly-hero-actions">
          <button className="primary-action" type="button" onClick={onStart}>
            参考買い目を作る
          </button>
          <span className="soft-note">当選を保証するものではありません。</span>
        </div>
      </div>

      <div className="friendly-hero-panel">
        <GameTypeTabs value={game} onChange={onGameChange} />
        <div className="hero-metrics">
          <MetricWithLabel
            label="最新データ更新日"
            value={latestDate}
            help="アプリに取り込まれている最新抽選日の目安です。"
          />
          <MetricWithLabel
            label="分析対象回数"
            value={drawCount.toLocaleString("ja-JP")}
            unit="回"
            help={`${GAME_SPECS[game].label}で分析に使っている過去抽選の回数です。`}
          />
        </div>
        <SimpleStepGuide />
        <p className="gentle-disclaimer">
          当選を保証するものではありません。過去データを使った参考分析としてお楽しみください。
        </p>
      </div>
    </section>
  );
}
