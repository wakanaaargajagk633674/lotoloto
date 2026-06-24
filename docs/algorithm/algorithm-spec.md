# Algorithm Spec

## 目的

Lotoloto は、ロト6・ロト7の当せん番号を保証するアプリではない。過去データを材料に、戦略テーマ別の説明可能な参考買い目を生成する。

## Game Spec

| game | 範囲 | 本数字 | ボーナス | 価格 | 1等理論確率 |
|---|---:|---:|---:|---:|---:|
| loto6 | 1-43 | 6 | 1 | 200円 | 1 / 6,096,454 |
| loto7 | 1-37 | 7 | 2 | 300円 | 1 / 10,295,472 |

## Strategy Types

- balance: バランス型
- frequent: 頻出数字型
- overdue: 未出現数字型
- high_payout: 高配当狙い型
- random: ランダム重視型
- sougaku_delete: sougaku参考削除数字型
- mixed: 複合ミックス型

## Number Features

各数字 n に対して以下を計算する。

- totalFrequency
- recent30Frequency
- recent50Frequency
- recent100Frequency
- recent300Frequency
- longTermFrequency
- lastSeenGap
- averageGap
- maxGap
- currentGapZScore
- appearedInPreviousDraw
- appearedInPreviousBonus
- oddEven
- rangeGroup
- tensGroup
- lastDigit
- over31Flag
- birthdayPopularityRisk
- humanPopularityRisk
- antiPopularityScore
- deletionCandidateScore
- sougakuDeletionScore
- sougakuPartitionScore
- carryoverContextScore
- randomNoise

## Combination Features

買い目全体に対して以下を計算する。

- sum
- oddCount / evenCount
- lowCount / midCount / highCount
- over31Count
- consecutivePairCount
- maxConsecutiveRun
- sameLastDigitCount
- tensGroupDistribution
- previousDrawOverlap
- previousBonusOverlap
- averageNumberScore
- deletionRiskScore
- popularityAvoidanceScore
- balanceScore
- diversityScore
- explanationScore

## Scoring

数字スコアは `src/config/strategyWeights.ts` の重みで合成する。

```text
numberScore =
  w_recent * z(recentFrequency)
  + w_long * z(longTermFrequency)
  + w_gap * z(lastSeenGap)
  + w_prev * appearedInPreviousDraw
  + w_bonus * appearedInPreviousBonus
  + w_anti_pop * antiPopularityScore
  - w_delete * deletionCandidateScore
  + w_sougaku * (sougakuPartitionScore - sougakuDeletionScore)
  + w_random * randomNoise
```

スコアは戦略内の相対指標であり、当せん確率ではない。

## Generation

1. 履歴データから数字特徴量を作る。
2. 戦略重みにより数字スコアを計算する。
3. 候補プールを作る。
4. seed付き乱数で重み付きサンプリングする。
5. 組み合わせ特徴量で再採点する。
6. ロト6/ロト7の範囲、個数、重複なしを検証する。
7. 複数口ではチケット間の数字重複に軽いペナルティをかける。

## Strategy Defaults

初期値はユーザー指定の重みに合わせ、`strategyWeights.ts` に実装した。`mixed` は複数戦略を口ごとに切り替える。

## Safety

- 削除数字は既定で soft penalty。
- high_payout は31超を優先するが、当たりやすさとは説明しない。
- frequent/overdue はユーザーが選ぶテーマであり、統計的優位性を主張しない。

