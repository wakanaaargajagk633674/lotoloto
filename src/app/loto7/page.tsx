import type { Metadata } from "next";
import GameAnalysisView from "@/components/analysis/GameAnalysisView";
import { loadAnalysis } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト7 過去データ分析出現回数当せん番号",
  description: "ロト7の当せん番号、出現回数、未出現期間、奇数偶数、合計値、キャリーオーバー、配当履歴を分析します。"
};

export default async function Loto7Page() {
  return <GameAnalysisView game="loto7" analysis={await loadAnalysis("loto7")} view="overview" />;
}
