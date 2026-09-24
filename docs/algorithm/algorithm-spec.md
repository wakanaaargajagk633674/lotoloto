# Algorithm Spec

## 目的

Lotoloto は、ロト6・ロト7の当せん番号を保証するアプリではない。過去データを材料に、戦略テーマ別の説明可能な参考買い目を生成する。

## Game Spec

| game | 範囲 | 本数字 | ボーナス | 価格 | 1等理論確率 |
|---|---:|---:|---:|---:|---:|
| loto6 | 1-43 | 6 | 1 | 200円 | 1 / 6,096,454 |
| loto7 | 1-37 | 7 | 2 | 300円 | 1 / 10,295,472 |

## Strategy Types

- balance: バランス
- hot_trend: ホットトレンド
- deep_gap: ディープギャップ
- high_return: ハイリターン
- pure_random: ピュアランダム
- pattern_filter: パターンフィルター
- smart_mix: スマートミックス

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
- candidateAdjustmentScore
- sourcePatternSignalScore
- sourcePatternBalanceScore
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
- lowPrioritySignalScore
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
  - w_candidate_tuning * candidateAdjustmentScore
  + w_pattern_filter * (sourcePatternBalanceScore - sourcePatternSignalScore)
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

初期値はユーザー指定の重みに合わせ、`strategyWeights.ts` に実装した。`smart_mix` は複数戦略を口ごとに切り替える。

## Safety

- パターンフィルターは既定で soft signal。
- high_return は31超を優先するが、当たりやすさとは説明しない。
- hot_trend/deep_gap はユーザーが選ぶテーマであり、統計的優位性を主張しない。

## Math Core (2026-09-08 再設計)

`src/loto/mathCore.ts` に、検定または導出で裏付けできる計算だけを集めた。すべて予想時点までの履歴だけを使う。

### 1. 一様性の検定と経験ベイズ縮小

- 数字ごとの出現回数にカイ二乗検定 (自由度 = 数字数 − 1) をかける。
- 実データ (loto6 第2135回 / loto7 第693回時点): loto6 χ² = 29.7, p = 0.92、loto7 χ² = 28.3, p = 0.82。
  どちらも一様抽せんと矛盾しない。
- James–Stein 型の縮小 `λ = max(0, 1 − dof / χ²)` で、二項分布の揺らぎで説明できる分散は捨て、
  超過分だけを事後確率に残す。実データでは λ = 0 となり、事後確率は完全に一様。
- `scoring.ts` では recent / long / gap の各シグナルを `EVIDENCE_FLOOR + (1 − EVIDENCE_FLOOR) × λ` 倍する。
  頻度シグナルは「戦略テーマの好み」としての下限 (0.35) だけを残し、統計的根拠が出た場合のみ強まる。

### 2. 販売口数の復元

- 販売額はデータに含まれないため、賞金がほぼ固定で当せん者数が多い等級 (loto6 5等 = 3個一致、loto7 5等 = 4個一致) の
  当せん口数 W と理論確率 p_k から `N ≈ median(W / p_k)` (過去12回) で復元する。
- 実データの推定口数は loto6 ≈ 664万口、loto7 ≈ 645万口。

### 3. 対数線形の人気度回帰

- `y_t = log(W_t / (N_t p_k))` を、その回の本数字の指示変数で Ridge 回帰する (λ = 4)。
- β_i は数字 i の対数人気度 (0 = 平均)。実データでは loto6 の上位が 11, 8, 3, 12, 7 (誕生日・縁起数字)、
  下位が 43, 34, 41, 40 (32以上) で、事前分布と独立に同じ構造が推定された。R² = 0.30 (loto6)、0.14 (loto7)。
- 参照等級は本数字の一部しか一致しないため、1等向けには `mainCount / matches` 倍 (loto6 = 2, loto7 = 1.75) で一次補正する。

### 4. 当せん時の期待受取係数

- 他人の1口が自分と同じ組み合わせである確率は `q(c) = exp(Σ β_i) / C(n, k)`。
- 同時当せん者数 X ≈ Poisson(m), m = N q(c) とすると `E[1 / (1 + X)] = (1 − e^{−m}) / m`。
- この `payoutFactor` (独占 = 1) を `expectedShareScore` に 50% 合成し、`explanations` にも同時当せん期待人数を表示する。
- 実データ例 (loto6): 1,2,3,4,5,6 は payoutFactor ≈ 0.53、33,35,37,39,41,43 は ≈ 0.69。
  当せん確率は同じで、差が出るのは当せん時の受取だけである。

### 5. ポートフォリオ被覆

- 複数口では 3 個組の重複率 `tripleCoverageRatio` を候補評価に加点 (重み 0.15) し、
  下位等級の当せんが同じ回に固まらないよう散らす。当せん確率の合計は口数だけで決まり、変わらない。

### 主張しないこと

- 上記のどれも「当たりやすさ」を変えない。検定はむしろ、頻度・間隔のシグナルに根拠がないことを毎回の予想で自動確認する。
- 期待値は購入額を下回る。期待受取係数は当せんした場合の山分け人数の目安にすぎない。

## Popularity Calibration (2026-09-25 較正)

`src/loto/popularityCalibration.ts`。25人会議 (docs/reviews/2026-09-25_prediction-method-25-expert-10-loop-review.md) で、
上の「3. 対数線形の人気度回帰」「4. 当せん時の期待受取係数」を標本外検証に基づいて置き換えた。
データが不足するとき (loto6 300回以下 / loto7 150回以下) は 3・4 の方式に自動で戻る。

### 等級換算の理論係数

- 購入口の選ばれやすさを exp(Σ_{j∈口} γ_j) (Σ_all γ = 0) とすると、k 個一致の等級の口数は一次近似で
  `log(W_k / (N p_k)) ≈ c_k · Σ_{i∈当せん} γ_i`,  `c_k = k/m − (m−k)/(n−m)`。
- 第2項は外れ枠に入る「当せん数字以外」の平均人気。旧実装の `mainCount / matches` はこれを無視していた。
- 1等 (k = m) は c = 1。1等口数の Poisson 回帰で、理論換算の傾きは loto6 1.04 ± 0.08 と理論値 1 に一致した。

### 推定

1. 学習等級 4+5 の行を、x = c_k · 1(i ∈ 当せん) として等級別切片つき Ridge (λ = 16) で解き、γ を得る。
   正規方程式を累積しながらウォークフォワード (10回ごと再学習) で各回の Σγ を標本外予測する。
2. その標本外予測で1等口数を Poisson 回帰する: `log λ_t = log(N̂_t / C) + a + s · Σγ̂_t + δ · pattern_t`。
   s ~ N(1, 0.3²)、δ ~ N(0, 0.1²) の事前分布つき。並びのクセは「全部31以下」「1-12が半分以上」「下1桁3個以上」「連番」「32以上2個以上」。
3. 設定値は `src/config/strategyWeights.ts` の `popularityCalibrationSettings`。

### 全等級の期待払戻

- `E[払戻] = Σ_k P_k · B_k · g_k(c)`。B_k は直近100回の賞金中央値 (1等は総額の中央値)。
- 1等: g = E[1/(1+X)], X ~ Poisson(N̂ exp(logPop(c)) / C)。
- 2等以下 (山分け): g = exp(−c_k² · s · Σγ_c)。ロト6の5等は固定1,000円なので g = 1。
- 基準額が1等の出た回に偏るため絶対値は過大になる。表示はランダムな口の中央値を100とした相対指数 `relativeReturnIndex` だけにする。
- `expectedShareScore` はランダムな口 2,000 口の払戻率の 5%点〜95%点で 0〜1 に目盛る。

### 検証 (入れ子のウォークフォワード, 人気差なしに対する1等口数の対数尤度改善)

| モデル | loto6 | loto7 |
|---|---:|---:|
| 旧方式 | +72.4 | +1.5 |
| 較正 s + δ (採用) | +81.0 | +2.7 |

`npm run validate:popularity` で再生成できる。当せん確率はどの組み合わせでも変わらない。
