import type { Metadata } from "next";
import GameAnalysisView from "@/components/analysis/GameAnalysisView";
import { loadAnalysis } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト7 過去当せんデータ",
  description: "ロト7の最新結果と過去当せんデータの概要を表示します。"
};

export default async function Loto7ResultsPage() {
  return <GameAnalysisView game="loto7" analysis={await loadAnalysis("loto7")} view="results" />;
}
