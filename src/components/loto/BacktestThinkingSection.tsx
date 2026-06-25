import MetricWithLabel from "@/components/loto/MetricWithLabel";
import { STRATEGY_LABELS } from "@/loto/constants";
import type { BacktestSummary, StrategyType } from "@/loto/types";

type Props = {
  backtest?: BacktestSummary;
};

export default function BacktestThinkingSection({ backtest }: Props) {
  const rows = backtest ? (Object.entries(backtest.strategies) as Array<[StrategyType, BacktestSummary["strategies"][StrategyType]]>) : [];
  const bestByMatches = [...rows].sort((a, b) => b[1].averageMainMatches - a[1].averageMainMatches)[0];

  return (
    <section className="backtest-thinking-section">
      <p className="section-label">バックテストの考え方</p>
      <h2>未来のデータを使わずに、過去で試す。</h2>
      <p>
        バックテストは、過去のある時点に戻り、その時点までに分かっていたデータだけで参考買い目を作る検証です。
        良く見える結果でも、偶然や期間の偏りを含むため、当選しやすさの保証には使いません。
      </p>

      {bestByMatches ? (
        <div className="backtest-metrics">
          <MetricWithLabel
            label="平均一致数が最も高かったモード"
            value={STRATEGY_LABELS[bestByMatches[0]]}
            help="今回の初期バックテストで平均一致数が相対的に高かったモードです。優劣を断定するものではありません。"
          />
          <MetricWithLabel
            label="平均一致数"
            value={bestByMatches[1].averageMainMatches.toFixed(3)}
            unit="個/口"
            help="1口あたり平均で本数字が何個一致したかを示します。"
          />
          <MetricWithLabel
            label="3個以上一致した割合"
            value={(bestByMatches[1].match3PlusRate * 100).toFixed(2)}
            unit="%"
            help="本数字が3個以上一致した試行の割合です。偶然の範囲を含みます。"
          />
        </div>
      ) : (
        <p className="soft-note">バックテスト結果がまだありません。</p>
      )}
    </section>
  );
}
