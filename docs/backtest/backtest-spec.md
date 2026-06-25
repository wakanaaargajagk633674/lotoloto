# Backtest Spec

## Principle

バックテストは必ずウォークフォワード方式で行う。未来データを使って過去を予想してはいけない。

## Procedure

ロト6の例:

1. 第1回から第300回を学習。
2. 第301回を予想。
3. 第1回から第301回を学習。
4. 第302回を予想。
5. 最終回まで繰り返す。

ロト7は初期データが少ないため、初期実装では第120回までを学習窓にした。

## Compared Strategies

- balance
- hot_trend
- deep_gap
- high_return
- pure_random
- pattern_filter
- smart_mix

## Metrics

- 平均一致数
- 3個以上一致率
- 等級別的中数
- pure_randomとの差
- 払戻額
- 1口あたり平均払戻
- 最大ドローダウン
- 期間別安定性
- ロト6/ロト7別の違い

## Outputs

- `data/backtest/results/loto6_backtest_summary.json`
- `data/backtest/results/loto7_backtest_summary.json`
- `data/backtest/results/loto6_backtest_detail.csv`
- `data/backtest/results/loto7_backtest_detail.csv`
- `docs/backtest/backtest-report.md`

## Pattern Filter

パターンフィルターは、参考サイト由来の候補選別思想を直接的な除外ではなく、候補の優先度を調整する soft signal として検証する。

比較では以下を見る。

- pattern filter off
- light
- focused
- strict
- pattern balance only

## Initial Run

2026-06-25 に実データで初回実行した。戦略名刷新後は `npm run backtest` で再生成する。

結果は戦略間で差があるように見える箇所もあるが、pure_randomとの差は小さく、過剰最適化や偶然の揺れを疑うべき範囲。UIでは「有利な戦略」ではなく「参考テーマ」として表示する。
