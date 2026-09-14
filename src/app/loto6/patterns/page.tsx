import type { Metadata } from "next";
import GameAnalysisView from "@/components/analysis/GameAnalysisView";
import { loadAnalysis, loadTrends } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト6 パターン分析 傾向表と絞り込み参考",
  description: "ロト6の●○出目表、6分割・細分割傾向表、集計表と、25数字以内への絞り込み参考を掲載します。"
};

export default async function Loto6PatternsPage() {
  return <GameAnalysisView game="loto6" analysis={await loadAnalysis("loto6")} trends={await loadTrends("loto6")} view="patterns" />;
}
