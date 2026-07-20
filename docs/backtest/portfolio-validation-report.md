# Portfolio Validation Report

直近120回を対象に、各回の直前までの履歴だけを使って Loto6 は20点、Loto7 は10点を生成した短期ウォークフォワード検証。
ロトはランダム抽せんなので、この結果は将来の当せん確率向上を保証しない。買い目の重複抑制、カバレッジ、過去検証上の挙動を見るための参考値。

| game | profile | draws | tickets | prize hits | ticket hit rate | at least one hit/draw | avg main matches | max main matches | payout/spend | avg unique coverage |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| loto6 | smart_mix_recommended | 120 | 2400 | 75 | 3.13% | 50.00% | 0.841 | 4 | 17.5% | 42.8 |
| loto6 | pure_random_control | 120 | 2400 | 69 | 2.88% | 49.17% | 0.853 | 4 | 20.9% | 43.0 |
| loto6 | high_return_control | 120 | 2400 | 62 | 2.58% | 40.00% | 0.840 | 5 | 109.2% | 42.7 |
| loto7 | smart_mix_recommended | 120 | 1200 | 46 | 3.83% | 27.50% | 1.317 | 5 | 15.3% | 29.6 |
| loto7 | pure_random_control | 120 | 1200 | 47 | 3.92% | 35.83% | 1.333 | 4 | 14.4% | 34.5 |
| loto7 | high_return_control | 120 | 1200 | 35 | 2.92% | 25.00% | 1.333 | 5 | 12.6% | 30.9 |

採用判断:

- Loto6: 直近120回の20点運用では high_return_control が低等級ヒット件数で最良。smart_mix は5一致の一回で払戻比率が上振れたが、ヒット率の優位とは扱わない。
- Loto7: 直近120回の10点運用では pure_random_control が最良。今回はLoto7に予測寄りの追加補正を採用せず、ランダム分散を重視する。
- いずれも当選保証ではない。購入額を増やす判断材料にはしない。
