import type { Metadata } from "next";
import Link from "next/link";
import NoticeBox from "@/components/site/NoticeBox";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "lotolotoについて",
  description: "lotolotoはロト6ロト7の公開データを見やすく整理する分析サイトです。"
};

export default function AboutPage() {
  return (
    <main className="site-main">
      <PageHero
        label="About"
        title="lotolotoについて"
        description="lotolotoは、ロト6ロト7の過去当せんデータを見やすく整理し、CSVと分析ページとして公開する情報サイトです。"
        actions={
          <>
            <Link className="secondary-action" href="/methodology">分析方法を見る</Link>
            <Link className="secondary-action" href="/downloads">CSVを見る</Link>
          </>
        }
      />
      <NoticeBox>
        当せん番号の予測や当せん保証を行うものではありません。公開データを使った参考分析としてご利用ください。
      </NoticeBox>
      <section className="card-grid">
        <article className="analysis-card">
          <h2>大切にしていること</h2>
          <ul className="friendly-list">
            <li>数字だけでなく、意味と注意点を一緒に表示します。</li>
            <li>出現回数や未出現期間を、未来予測のように見せません。</li>
            <li>データソースと照合状況を記録します。</li>
            <li>CSVを公開し、閲覧者が自分で確認できる形にします。</li>
          </ul>
        </article>
        <article className="analysis-card">
          <h2>参考買い目ページの扱い</h2>
          <p>参考買い目生成は、過去傾向をもとに数字の組み合わせを整理して表示する機能です。分析サイトの補助機能として提供し、買い目を主役にしすぎない設計にしています。</p>
          <p>表示される買い目は、当せん番号を予測するものではありません。</p>
        </article>
      </section>
    </main>
  );
}
