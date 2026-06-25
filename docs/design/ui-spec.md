# UI Spec

## Top Order

1. ヒーロー
2. かんたん設定
3. 参考買い目
4. なぜこの数字？
5. 過去データの見方
6. 注意事項
7. バックテストの考え方

## Hero

Name: LOTOLOTO Light Insight

Headline:

> ロト6ロト7の数字を、やさしく分析。

Description:

> 過去の抽選データをもとに、出現回数、間隔、バランスを整理し、参考買い目をわかりやすく表示します。

Required elements:

- ロト6 / ロト7切り替え
- 最新データ更新日
- 分析対象回数
- かんたん3ステップ
- CTA: 参考買い目を作る
- 自然な注意文

## Generator Settings

Required elements:

- 作る買い目の数
- 分析タイプ
- ランダム性を残す強さ
- パターン参考の強さ
- 分配リスク意識の強さ
- 折りたたみ詳細設定

UX:

- 初心者はロト、分析タイプ、口数だけで進める。
- 詳細設定は閉じた状態を基本にする。
- スライダーは当たりやすさではなく、参考指標の強さとして説明する。

## Strategy Cards

Each card must show:

- モード名
- ひとことで説明
- 向いている人
- 注意点

Mode names:

- バランス重視
- よく出ている数字参考
- しばらく出ていない数字参考
- 分配リスクを意識
- ランダム中心
- パターン参考
- おまかせミックス

## Result

Required elements:

- 買い目番号
- ロト種別
- 予想タイプ
- 数字ボール
- 総合コメント
- 主な特徴3つ
- 詳細を見るボタン
- 数字をコピー

All metrics must include a label and unit.

Examples:

- 総合バランス: 82 / 100
- 奇数偶数のバランス: 3 対 3
- 合計値: 138
- 32以上の数字: 2個

## Number Reason Panel

Use beginner language.

- 過去出現回数: 326回
- 直近100回の出現回数: 14回
- 前回からの間隔: 18回
- 参考スコア: 72 / 100

Avoid internal names such as `recent100Frequency`, `antiPopularityScore`, and raw score labels in UI.

## Data Insight Section

Move advanced analysis under "詳しく見る".

Sections:

- 出現回数ランキング
- 直近100回の出現回数
- 前回からの間隔
- 組み合わせの見方

Each metric must explain what it means and warn where needed that it does not predict the next draw.

## Components

Implemented:

- LightAppShell
- FriendlyHeroSection
- SimpleStepGuide
- GameTypeTabs
- FriendlyStrategyCard
- GentleTicketCard
- NumberBall
- MetricWithLabel
- MetricHelpTooltip
- FriendlyReasonPanel
- DataInsightSection
- ResponsibleNotice
- BacktestThinkingSection
- EmptyState
- LoadingSkeleton
