import type { Metadata } from "next";
import GameAnalysisView from "@/components/analysis/GameAnalysisView";
import { loadAnalysis } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト6 過去データ分析出現回数当せん番号",
  description: "ロト6の当せん番号、出現回数、未出現期間、奇数偶数、合計値、キャリーオーバー、配当履歴を分析します。"
};

export default async function Loto6Page() {
  return <GameAnalysisView game="loto6" analysis={await loadAnalysis("loto6")} view="overview" />;
}
