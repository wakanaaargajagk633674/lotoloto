# Pattern Filtering Spec

## 前提

参考サイトでは特定候補を除外する考え方が紹介されている。本プロジェクトでは、この考え方を直接的な除外ではなく、候補の優先度を調整する soft signal として扱う。

## Lotolotoでの名称

- UI名: パターンフィルター
- 説明名: 候補調整、パターン選別、低優先候補、組み合わせ調整
- 内部ID: `pattern_filter`
- 主要特徴量:
  - `candidateAdjustmentScore`
  - `sourcePatternSignalScore`
  - `sourcePatternBalanceScore`
  - `lowPrioritySignalScore`

## 実装方針

パターンフィルターは3層に分ける。

1. `candidateAdjustmentScore`
   - 過去頻度、数字間隔、人気リスクなどから作る候補優先度の調整信号。
2. `sourcePatternSignalScore`
   - 参考サイトや外部ロジックで低優先とされた候補を、直接除外ではなく信号として保持する。
3. `sourcePatternBalanceScore`
   - 魔法陣の直接再現ではなく、数字帯のばらけを抽象化したスコア。

## Candidate Tuning Modes

| mode | 挙動 |
|---|---|
| off | 候補調整を使わない |
| light | 軽い抑制 |
| focused | 強めの抑制 |
| strict | 比較検証用に低優先候補を外す |

`strict` は既定にしない。UIでは「除外」ではなく「候補優先度の調整」と説明する。

## Backtest Variants

- pure_random
- balance without pattern filter
- pattern filter light
- pattern filter focused
- pattern filter strict
- pattern balance only
- pattern signal + pattern balance

## Required UI Copy

> このフィルターは、過去データの並び間隔バランスを参考に候補の優先度を調整するものです。当選確率の向上を保証するものではありません。

Number-level explanation:

> 過去傾向から、今回の組み合わせでは優先度を少し下げた数字です。除外や的中保証を意味するものではありません。
