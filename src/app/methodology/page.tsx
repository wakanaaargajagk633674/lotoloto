import type { Metadata } from "next";
import Link from "next/link";
import NoticeBox from "@/components/site/NoticeBox";
import PageHero from "@/components/site/PageHero";
import { loadQualityReport } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "分析方法とデータソース",
  description: "lotolotoで使う公式みずほ銀行データ、sougaku履歴データ、照合方法、CSV整形、バックテストの注意点を説明します。"
};

export default async function MethodologyPage() {
  const qualityReport = await loadQualityReport();
  return (
    <main className="site-main">
      <PageHero
        label="Methodology"
        title="分析方法とデータソース"
        description="lotolotoは、公開されているロト6ロト7の当せんデータを整形し、数字別出現回数、未出現期間、合計値、連番、キャリーオーバー、配当履歴を分析します。"
        actions={
          <>
            <Link className="secondary-action" href="/downloads">CSVダウンロード</Link>
            <Link className="secondary-action" href="/expert-review">専門家の見方</Link>
          </>
        }
      />
      <NoticeBox>
        本サイトは過去データを整理分析する情報サイトです。当せん番号の予測や当せん保証を行うものではありません。
      </NoticeBox>

      <section className="card-grid">
        <article className="analysis-card">
          <h2>データソース</h2>
          <dl className="definition-grid">
            <div>
              <dt>公式確認</dt>
              <dd>みずほ銀行 当せん番号案内CSV</dd>
            </div>
            <div>
              <dt>履歴データ</dt>
              <dd>sougaku公開ZIPを整形</dd>
            </div>
            <div>
              <dt>正規化形式</dt>
              <dd>JSON / CSV / ダウンロード用CSV</dd>
            </div>
          </dl>
          <p>公式CSVで取得できる直近範囲を保存し、同じ回号が履歴データにもある場合は本数字、ボーナス数字、販売実績額、キャリーオーバー、等級別配当を比較します。</p>
        </article>

        <article className="analysis-card">
          <h2>分析項目</h2>
          <ul className="friendly-list">
            <li>数字別出現回数: 全期間、直近30回、50回、100回、300回を集計します。</li>
            <li>未出現期間: 最後に出てから何回抽せんが行われたかを表示します。</li>
            <li>合計値と奇数偶数: 本数字の合計値や奇数偶数の組み合わせを整理します。</li>
            <li>パターン参考: 数字帯、末尾、前回重複、連番などを確認します。</li>
            <li>キャリーと配当: 配当面を見るため、キャリーオーバーと等級別配当を整理します。</li>
          </ul>
        </article>

        <article className="analysis-card">
          <h2>バックテストの考え方</h2>
          <p>参考買い目生成では、未来データを使わないウォークフォワード方式を前提にしています。過去の第1回から一定期間を学習し、次の1回を評価する形で進め、後から未来の結果を使って過去の予想を作ることはしません。</p>
          <p>バックテスト結果が良く見える場合も、偶然や期間依存、過剰最適化の可能性を疑います。</p>
        </article>

        <article className="analysis-card">
          <h2>CSV利用時の注意</h2>
          <p>CSVは分析用に整形したデータです。内容の正確性には注意していますが、購入や換金に関わる確認は必ず公式情報をご確認ください。</p>
          <p>Excelで開きやすいUTF-8 BOM付きCSVと、システム連携しやすいBOMなしCSVを用意しています。</p>
        </article>
      </section>

      <section className="analysis-section">
        <h2>データ品質レポート</h2>
        <p className="soft-note">公式確認範囲と履歴データの照合結果です。差分がある項目は、データ品質レポートとCSVに記録します。</p>
        <pre className="quality-report">{qualityReport || "データ品質レポートを読み込めませんでした。"}</pre>
      </section>
    </main>
  );
}
