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
        title="ロト6ロト7 CSVデータダウンロード"
        description="分析用に整形したCSVをダウンロードできます。Excelで開きやすいUTF-8 BOM付きCSVも用意しています。"
      />
      <NoticeBox title="CSV利用時の注意">
        本CSVは、公開されている当せん番号情報をもとにlotolotoが分析用に整形したデータです。内容の正確性には注意していますが、購入換金等の判断には必ず公式情報をご確認ください。公式情報との照合状況はデータ品質レポートに記録しています。
      </NoticeBox>
      <section className="download-card-grid" aria-label="CSVダウンロード一覧">
        {manifest.map((item) => (
          <article className="download-card" key={`${item.game}-${item.fileName}`}>
            <div>
              <span className="card-kicker">{item.game.toUpperCase()}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
            <dl className="definition-grid">
              <div><dt>行数</dt><dd>{item.rows.toLocaleString("ja-JP")}行</dd></div>
              <div><dt>最終更新日</dt><dd>{new Date(item.lastUpdated).toLocaleString("ja-JP")}</dd></div>
              <div><dt>データソース</dt><dd>{item.source}</dd></div>
              <div><dt>検証状態</dt><dd>{item.verificationStatus}</dd></div>
            </dl>
            <div className="download-actions">
              <Link className="download-button" href={`/downloads/${item.bomFileName}`}>CSVをダウンロード</Link>
              <Link className="text-link" href={`/downloads/${item.fileName}`}>BOMなしCSV</Link>
            </div>
          </article>
        ))}
      </section>
      <p className="soft-note">データ品質レポート: <code>data/quality/source-quality-report.md</code></p>
    </main>
  );
}
