# Portfolio Validation Report

直近120回を対象に、各回の直前までの履歴だけを使って Loto6 は20点、Loto7 は10点を生成した短期ウォークフォワード検証。
ロトはランダム抽せんなので、この結果は将来の当せん確率向上を保証しない。買い目の重複抑制、カバレッジ、過去検証上の挙動を見るための参考値。

| game | profile | draws | tickets | prize hits | ticket hit rate | at least one hit/draw | avg main matches | max main matches | payout/spend | avg unique coverage |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| loto6 | smart_mix_recommended | 120 | 2400 | 62 | 2.58% | 43.33% | 0.836 | 5 | 82.5% | 42.8 |
| loto6 | pure_random_control | 120 | 2400 | 72 | 3.00% | 49.17% | 0.845 | 4 | 21.4% | 43.0 |
| loto6 | high_return_control | 120 | 2400 | 80 | 3.33% | 51.67% | 0.833 | 4 | 22.0% | 42.8 |
| loto7 | smart_mix_recommended | 120 | 1200 | 37 | 3.08% | 23.33% | 1.312 | 5 | 12.7% | 29.6 |
| loto7 | pure_random_control | 120 | 1200 | 46 | 3.83% | 33.33% | 1.357 | 4 | 14.1% | 34.5 |
| loto7 | high_return_control | 120 | 1200 | 40 | 3.33% | 28.33% | 1.341 | 5 | 13.9% | 30.7 |

採用判断:

- Loto6: 直近120回の20点運用では high_return_control が低等級ヒット件数で最良。smart_mix は5一致の一回で払戻比率が上振れたが、ヒット率の優位とは扱わない。
- Loto7: 直近120回の10点運用では pure_random_control が最良。今回はLoto7に予測寄りの追加補正を採用せず、ランダム分散を重視する。
- いずれも当選保証ではない。購入額を増やす判断材料にはしない。
