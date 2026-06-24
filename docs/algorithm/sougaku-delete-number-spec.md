# sougaku Delete Number Spec

## 前提

sougaku は削除数字を「予想から外しても良い数字」として公開している。しかし、削除した数字に未来の本数字が含まれないことを事前に保証できないため、本アプリでは削除数字を真実ではなく仮説として扱う。

## 実装方針

削除数字は3層に分ける。

1. `deletionCandidateScore`
   - アプリ側が過去頻度、未出現ギャップ、人気リスクなどから作る候補スコア。
2. `sougakuDeletionScore`
   - sougaku 公開ページなどから取得できた削除数字に該当するか。
3. `sougakuPartitionScore`
   - 魔法陣の直接再現ではなく、数字帯のばらけを抽象化したスコア。

## Modes

| mode | 挙動 |
|---|---|
| none | 削除数字を使わない |
| weak | 軽い減点 |
| strong | 強い減点 |
| hard | 完全除外。ユーザー選択または検証比較用のみ |

## Backtest Variants

- random
- balance without deletion
- deletion soft penalty
- deletion hard exclude
- partition only
- deletion + partition

## UI Copy

削除数字参考モードでは必ず以下を表示する。

> 削除数字は過去傾向から候補を絞る考え方ですが、当選確率の向上を保証するものではありません。本アプリでは検証可能なスコアとして扱います。

