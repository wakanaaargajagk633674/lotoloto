import MetricWithLabel from "@/components/loto/MetricWithLabel";

export type RankedNumberMetric = {
  rank: number;
  number: number;
  value: number;
};

export type DataInsightStats = {
  topFrequency: RankedNumberMetric[];
  recentTrend: RankedNumberMetric[];
  longestGap: RankedNumberMetric[];
  oddPercent: number;
  evenPercent: number;
  sumRange: string;
  consecutiveRate: number;
  previousOverlapAverage: string;
  over31Rate: number;
};

type Props = {
  stats: DataInsightStats;
};

export default function DataInsightSection({ stats }: Props) {
  return (
    <section className="data-insight-section">
      <details>
        <summary>
          <span>詳しく見る</span>
          <strong>過去データの見方</strong>
        </summary>

        <div className="data-insight-grid">
          <InsightGroup
            title="出現回数ランキング"
            description="過去の抽選で、本数字として出た回数です。多い数字が次回も出るとは限りません。"
            items={stats.topFrequency}
            metricLabel="過去出現回数"
            unit="回"
            help="この数字が過去の本数字に含まれた回数です。"
          />
          <InsightGroup
            title="直近100回の出現回数"
            description="最近の抽選で本数字に含まれた回数です。短期の傾向を見る参考情報です。"
            items={stats.recentTrend}
            metricLabel="直近100回の出現回数"
            unit="回"
            help="直近100回の抽選で、この数字が本数字に含まれた回数です。"
          />
          <InsightGroup
            title="前回からの間隔"
            description="最後に出てから何回抽選が行われたかを示します。間隔が空いていても、次に出る保証はありません。"
            items={stats.longestGap}
            metricLabel="前回からの間隔"
            unit="回"
            help="この数字が最後に出てから、何回抽選が行われたかを示します。"
          />

          <div className="insight-group">
            <h3>組み合わせの見方</h3>
            <p>買い目全体の偏りを見るための参考情報です。</p>
            <MetricWithLabel
              label="奇数の割合"
              value={stats.oddPercent}
              unit="%"
              help="過去の本数字全体に占める奇数の割合です。"
            />
            <MetricWithLabel
              label="偶数の割合"
              value={stats.evenPercent}
              unit="%"
              help="過去の本数字全体に占める偶数の割合です。"
            />
            <MetricWithLabel
              label="合計値の中心帯"
              value={stats.sumRange}
              help="過去の買い目合計値の25から75パーセンタイルの範囲です。"
            />
            <MetricWithLabel
              label="連番を含む回の割合"
              value={stats.consecutiveRate}
              unit="%"
              help="過去の抽選で、少なくとも1組の連番を含んだ回の割合です。"
            />
            <MetricWithLabel
              label="前回数字との平均重複"
              value={stats.previousOverlapAverage}
              unit="個"
              help="前回の本数字と次回の本数字が平均で何個重なったかを示します。"
            />
            <MetricWithLabel
              label="32以上を含む回の割合"
              value={stats.over31Rate}
              unit="%"
              help="過去の抽選で、32以上の数字を少なくとも1個含んだ回の割合です。"
            />
          </div>

        </div>
      </details>
    </section>
  );
}

function InsightGroup({
  title,
  description,
  items,
  metricLabel,
  unit,
  help
}: {
  title: string;
  description: string;
  items: RankedNumberMetric[];
  metricLabel: string;
  unit: string;
  help: string;
}) {
  return (
    <div className="insight-group">
      <h3>{title}</h3>
      <p>{description}</p>
      {items.map((item) => (
        <MetricWithLabel
          key={`${title}-${item.number}`}
          label={`${item.rank}位 数字 ${item.number.toString().padStart(2, "0")}`}
          value={item.value}
          unit={unit}
          help={help}
        />
      ))}
    </div>
  );
}
