import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import NoticeBox from "@/components/site/NoticeBox";
import { loadDownloadManifest } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト6ロト7 CSVデータダウンロード",
  description: "ロト6ロト7の全当せんデータ、数字別出現回数、直近100回分析、キャリーオーバー履歴、等級別配当履歴をCSVでダウンロードできます。"
};

export default async function DownloadsPage() {
  const manifest = await loadDownloadManifest();
  return (
    <main className="site-main">
      <PageHero
        label="CSV Download"
        title="ロト6ロト7のデータをCSVで保存"
        description="当せんデータや数字別の出現回数を、表計算ソフトで見やすいCSVとして保存できます。"
      />
      <NoticeBox title="CSV利用時の注意">
        CSVはロトの過去データを見やすく整理したものです。購入や換金に関わる確認は、必ず公式情報をご確認ください。
      </NoticeBox>
      <section className="download-card-grid" aria-label="CSVダウンロード一覧">
        {manifest.map((item) => (
          <article className="download-card" key={`${item.game}-${item.fileName}`}>
            <div>
              <span className="card-kicker">{item.game.toUpperCase()}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
            <div className="download-actions">
              <Link className="download-button" href={`/downloads/${item.bomFileName}`}>Excel向けCSV</Link>
              <Link className="text-link" href={`/downloads/${item.fileName}`}>通常CSV</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
