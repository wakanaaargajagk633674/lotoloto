import type { Metadata } from "next";
import GameAnalysisView from "@/components/analysis/GameAnalysisView";
import { loadAnalysis } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト7 パターン分析 数字帯末尾前回重複",
  description: "ロト7の数字帯、末尾、前回重複、組み合わせバランスを参考情報として整理します。"
};

export default async function Loto7PatternsPage() {
  return <GameAnalysisView game="loto7" analysis={await loadAnalysis("loto7")} view="patterns" />;
}
