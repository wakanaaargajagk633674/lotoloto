import type { Metadata } from "next";
import GameAnalysisView from "@/components/analysis/GameAnalysisView";
import { loadAnalysis, loadTrends } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト7 パターン分析 傾向表と絞り込み参考",
  description: "ロト7の●○出目表、6分割・細分割傾向表、集計表と、25数字以内への絞り込み参考を掲載します。"
};

export default async function Loto7PatternsPage() {
  return <GameAnalysisView game="loto7" analysis={await loadAnalysis("loto7")} trends={await loadTrends("loto7")} view="patterns" />;
}
