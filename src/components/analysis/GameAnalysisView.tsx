import Link from "next/link";
import DistributionList from "@/components/analysis/DistributionList";
import DownloadCsvButton from "@/components/analysis/DownloadCsvButton";
import GapRankingTable from "@/components/analysis/GapRankingTable";
import HowToReadBox from "@/components/analysis/HowToReadBox";
import LatestDrawCard from "@/components/analysis/LatestDrawCard";
import NumberFrequencyChart from "@/components/analysis/NumberFrequencyChart";
import NumberFrequencyTable from "@/components/analysis/NumberFrequencyTable";
import PatternInsightCards from "@/components/analysis/PatternInsightCards";
import PrizeTierTable from "@/components/analysis/PrizeTierTable";
import RecentDrawsTable from "@/components/analysis/RecentDrawsTable";
import NoticeBox from "@/components/site/NoticeBox";
import PageHero from "@/components/site/PageHero";
import { GAME_SPECS } from "@/loto/constants";
import type { LotoAnalysis } from "@/loto/analysis";
import type { GameType } from "@/loto/types";
import { formatYen } from "@/loto/format";

type Props = {
  game: GameType;
  analysis: LotoAnalysis | null;
  view: "overview" | "results" | "statistics" | "patterns";
};

export default function GameAnalysisView({ game, analysis, view }: Props) {
  const label = GAME_SPECS[game].label;
  if (!analysis) {
    return (
      <main className="site-main">
        <PageHero label={label} title={`${label} 分析`} description="分析データを読み込めませんでした。" />
      </main>
    );
  }

  return (
    <main className="site-main">
      <PageHero
        label={`${label} 過去データ分析`}
        title={`${label}の当せんデータを見やすく整理`}
        description="最新結果、数字別出現回数、未出現期間、奇数偶数、合計値、連番、キャリーオーバー、配当履歴を確認できます。"
        actions={
          <>
            <Link className="secondary-action" href={`/${game}/results`}>過去当せんデータ</Link>
            <Link className="secondary-action" href={`/${game}/statistics`}>統計分析</Link>
            <Link className="secondary-action" href={`/${game}/patterns`}>パターン分析</Link>
            <DownloadCsvButton href={`/downloads`}>CSVダウンロード</DownloadCsvButton>
          </>
        }
      />
      <NoticeBox>
        本サイトは、ロト6ロト7の公開データを整理分析する情報サイトです。当せん番号の予測や当せんを保証するものではありません。
      </NoticeBox>

      {(view === "overview" || view === "results") && (
        <section className="analysis-section" id="latest">
          <HowToReadBox>最新回の本数字、ボーナス数字、販売実績額、キャリーオーバーを確認できます。購入や換金に関わる確認は必ず公式情報をご確認ください。</HowToReadBox>
          <LatestDrawCard draw={analysis.latestDraw} />
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>項目</th>
                  <th>値</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>合計値の平均</td><td>{analysis.sumStats.average.toFixed(1)}</td></tr>
                <tr><td>合計値の中央値</td><td>{analysis.sumStats.median}</td></tr>
                <tr><td>最新キャリーオーバー</td><td>{formatYen(analysis.carryover.latestAmount)}</td></tr>
              </tbody>
            </table>
          </div>
          {view === "results" ? (
            <div className="analysis-subsection">
              <div className="section-heading compact">
                <h2>直近30回の当せんデータ</h2>
                <p>本数字、ボーナス数字、販売実績額、キャリーオーバーを一覧で確認できます。</p>
              </div>
              <RecentDrawsTable draws={analysis.recentDraws ?? []} />
              <DownloadCsvButton href={`/downloads/${game}_draws_japanese_bom.csv`}>全期間CSVをダウンロード</DownloadCsvButton>
            </div>
          ) : null}
        </section>
      )}

      {(view === "overview" || view === "statistics") && (
        <>
          <section className="analysis-section" id="frequency">
            <h2>数字別出現回数</h2>
            <HowToReadBox>過去の抽せんで、本数字として出た回数です。出現回数が多い数字が、次回も出るとは限りません。</HowToReadBox>
            <NumberFrequencyChart rows={analysis.numberAnalysis} />
            <NumberFrequencyTable rows={analysis.numberAnalysis} limit={20} />
            <DownloadCsvButton href={`/downloads/${game}_number_frequency_bom.csv`} />
          </section>

          <section className="analysis-section" id="gap">
            <h2>未出現期間</h2>
            <HowToReadBox>最後に出てから何回抽せんが行われたかを示します。長く出ていない数字が、そろそろ出るとは限りません。</HowToReadBox>
            <GapRankingTable rows={analysis.numberAnalysis} />
            <DownloadCsvButton href={`/downloads/${game}_recent100_bom.csv`} />
          </section>

          <section className="two-column-section">
            <DistributionList title="奇数偶数バランス" rows={analysis.oddEvenDistribution} />
            <DistributionList title="連番分析" rows={analysis.consecutiveDistribution} />
            <DistributionList title="数字帯分析" rows={analysis.rangeDistribution} />
            <DistributionList title="末尾分析" rows={analysis.lastDigitDistribution} />
          </section>
        </>
      )}

      {(view === "overview" || view === "patterns") && (
        <section className="analysis-section" id="patterns">
          <h2>パターン参考</h2>
          <HowToReadBox>過去の並び方や数字の組み合わせを参考にした情報であり、数字を除外したり当せんを保証したりするものではありません。</HowToReadBox>
          <PatternInsightCards game={game} />
          <DistributionList title="前回数字との重複" rows={analysis.previousOverlapDistribution} />
        </section>
      )}

      {(view === "overview" || view === "statistics") && (
        <section className="analysis-section" id="carry-prize">
          <h2>キャリーオーバーと配当</h2>
          <HowToReadBox>キャリーオーバーは配当面に影響する場合がありますが、当せんしやすくなるものではありません。</HowToReadBox>
          <div className="summary-grid">
            <article className="analysis-card">
              <h3>キャリーオーバー</h3>
              <dl className="definition-grid">
                <div><dt>発生回数</dt><dd>{analysis.carryover.occurrenceCount.toLocaleString("ja-JP")}回</dd></div>
                <div><dt>最大金額</dt><dd>{formatYen(analysis.carryover.maxAmount)}</dd></div>
                <div><dt>最新金額</dt><dd>{formatYen(analysis.carryover.latestAmount)}</dd></div>
              </dl>
              <DownloadCsvButton href={`/downloads/${game}_carryover_bom.csv`} />
            </article>
            <article className="analysis-card">
              <h3>等級別配当</h3>
              <PrizeTierTable analysis={analysis} />
              <DownloadCsvButton href={`/downloads/${game}_prize_tiers_bom.csv`} />
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
