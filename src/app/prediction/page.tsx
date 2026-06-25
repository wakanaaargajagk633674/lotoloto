import type { Metadata } from "next";
import LotoApp from "@/components/LotoApp";
import { loadBacktest, loadDraws } from "@/loto/dataAccess";

export const metadata: Metadata = {
  title: "ロト6ロト7 参考買い目生成",
  description: "ロト6ロト7の過去データをもとに、説明付きの参考買い目を作成します。当せんを保証するものではありません。"
};

export default async function PredictionPage() {
  const [loto6Draws, loto7Draws] = await Promise.all([loadDraws("loto6"), loadDraws("loto7")]);
  const [loto6Backtest, loto7Backtest] = await Promise.all([loadBacktest("loto6"), loadBacktest("loto7")]);
  return (
    <LotoApp
      initialDraws={{ loto6: loto6Draws, loto7: loto7Draws }}
      backtests={{ loto6: loto6Backtest, loto7: loto7Backtest }}
    />
  );
}
