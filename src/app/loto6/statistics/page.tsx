import type { Metadata } from "next";
import GameAnalysisView from "@/components/analysis/GameAnalysisView";
import { loadAnalysis } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト6 統計分析 出現回数未出現期間",
  description: "ロト6の数字別出現回数、未出現期間、奇数偶数、合計値、連番、配当を分析します。"
};

export default async function Loto6StatisticsPage() {
  return <GameAnalysisView game="loto6" analysis={await loadAnalysis("loto6")} view="statistics" />;
}
