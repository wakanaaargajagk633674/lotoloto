import Link from "next/link";
import DownloadCsvButton from "@/components/analysis/DownloadCsvButton";
import LatestDrawCard from "@/components/analysis/LatestDrawCard";
import PageHero from "@/components/site/PageHero";
import NoticeBox from "@/components/site/NoticeBox";
import { GAME_SPECS } from "@/loto/constants";
import { loadAnalysis } from "@/loto/dataAccess";
import { formatYen } from "@/loto/format";

export default async function HomePage() {
  const [loto6, loto7] = await Promise.all([loadAnalysis("loto6"), loadAnalysis("loto7")]);
  return (
    <main className="site-main">
      <PageHero
        label="ロト6ロト7 過去データ分析"
        title="ロト6ロト7の過去データを、見やすく分析。"
        description="当せん番号、出現回数、数字の間隔、奇数偶数、合計値、連番、キャリーオーバーなどを整理し、数字選びの参考になる情報として公開しています。"
        actions={
          <>
            <Link className="primary-action" href="/loto6">
              ロト6分析を見る
            </Link>
            <Link className="secondary-action" href="/loto7">
              ロト7分析を見る
            </Link>
            <Link className="ghost-action" href="/prediction">
              参考買い目へ
            </Link>
            <Link className="ghost-action" href="/downloads">
              CSVを保存
            </Link>
          </>
        }
      />

      <NoticeBox title="本サイトの位置づけ">
        本サイトは過去データを整理分析する情報サイトです。当せん番号の予測や当せん保証を行うものではありません。
      </NoticeBox>

      <section className="summary-grid">
        <article className="analysis-card highlight-card">
          <h2>まずはロト別に見る</h2>
          <p>最新結果、よく出ている数字、しばらく出ていない数字、合計値や連番の傾向をロト別にまとめています。</p>
          <div className="page-hero-actions">
            <Link className="secondary-action" href="/loto6">ロト6を見る</Link>
            <Link className="secondary-action" href="/loto7">ロト7を見る</Link>
          </div>
        </article>
        <article className="analysis-card">
          <h2>キャリーオーバー概要</h2>
          <dl className="definition-grid">
            <div>
              <dt>ロト6 最新キャリー</dt>
              <dd>{formatYen(loto6?.carryover.latestAmount ?? null)}</dd>
            </div>
            <div>
              <dt>ロト7 最新キャリー</dt>
              <dd>{formatYen(loto7?.carryover.latestAmount ?? null)}</dd>
            </div>
          </dl>
          <p>キャリーオーバーは配当面に影響する場合がありますが、当せんしやすくなるものではありません。</p>
        </article>
      </section>

      <section className="two-column-section">
        <LatestDrawCard draw={loto6?.latestDraw ?? null} />
        <LatestDrawCard draw={loto7?.latestDraw ?? null} />
      </section>

      <section className="card-grid">
        <Link className="route-card" href="/loto6">
          <span>{GAME_SPECS.loto6.label}</span>
          <strong>ロト6分析トップ</strong>
          <p>最新結果、出現回数、未出現期間、パターン、配当を確認できます。</p>
        </Link>
        <Link className="route-card" href="/loto7">
          <span>{GAME_SPECS.loto7.label}</span>
          <strong>ロト7分析トップ</strong>
          <p>ロト7の数字分布、連番、キャリー、配当の傾向を確認できます。</p>
        </Link>
        <Link className="route-card" href="/downloads">
          <span>CSV</span>
          <strong>CSVを保存</strong>
          <p>当せんデータや数字別の出現回数をCSVで保存できます。</p>
        </Link>
        <Link className="route-card" href="/prediction">
          <span>参考</span>
          <strong>参考買い目を作る</strong>
          <p>分析結果を見たあとに、参考用の買い目を作れます。</p>
        </Link>
      </section>
    </main>
  );
}
