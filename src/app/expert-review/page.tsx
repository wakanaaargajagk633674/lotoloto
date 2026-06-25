import type { Metadata } from "next";
import ExpertViewCard from "@/components/analysis/ExpertViewCard";
import NoticeBox from "@/components/site/NoticeBox";
import PageHero from "@/components/site/PageHero";
import { expertViews } from "@/loto/expertViews";

export const metadata: Metadata = {
  title: "10の視点で見るロト分析データの使い方",
  description: "確率論、統計、データ品質、UX、法務など10の視点から、ロト6ロト7分析データの使い方と注意点を整理します。"
};

export default function ExpertReviewPage() {
  return (
    <main className="site-main">
      <PageHero
        label="Expert Review"
        title="10の視点で見る、ロト分析データの使い方"
        description="過去データは数字の見方を広げる助けになります。一方で、未来の当せん番号を保証するものではありません。複数の視点から、参考にできる点と過信してはいけない点を整理しました。"
      />
      <NoticeBox>
        このページは、分析データを健全に使うためのガイドです。「当たりやすい数字」を示すものではありません。
      </NoticeBox>
      <section className="expert-grid" aria-label="10の専門家視点">
        {expertViews.map((view) => (
          <ExpertViewCard view={view} key={view.name} />
        ))}
      </section>
    </main>
  );
}
