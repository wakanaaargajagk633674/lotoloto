import type { Metadata } from "next";
import GameAnalysisView from "@/components/analysis/GameAnalysisView";
import { loadAnalysis } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト6 過去当せんデータ",
  description: "ロト6の最新結果と過去当せんデータの概要を表示します。"
};

export default async function Loto6ResultsPage() {
  return <GameAnalysisView game="loto6" analysis={await loadAnalysis("loto6")} view="results" />;
}
