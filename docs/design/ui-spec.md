# UI Spec

## Top

Name: LOTOLOTO Intelligence

Headline:

> 過去データから、数字の流れを読み解く。

Description:

> ロト6・ロト7の過去抽選データをもとに、頻度、間隔、バランス、人気回避傾向を分析し、参考買い目を生成します。

Required elements:

- Hero area
- Loto6 / Loto7 toggle
- Today's analysis status
- Latest data date
- Carryover information
- CTA to start reference generation
- Safety notice

## Generator Settings

Required elements:

- Game type
- Strategy type
- Ticket count
- Randomness strength
- Pattern filter strength
- High-return strength
- Expandable advanced settings

UX:

- Beginners can choose game, strategy, ticket count, then generate.
- Advanced parameters are grouped under details.
- Sliders use plain labels and do not imply improved odds.

## Result

Required elements:

- Ticket cards
- Number balls
- Total score
- Balance score
- Trend score
- Gap score
- Popularity avoidance score
- Pattern adjustment score
- Reasons per number
- Regenerate
- Copy result

Ticket cards should feel shareable, but not promotional or sensational.

## Number Reason Panel

Example language:

- 直近100回でやや出現多め
- 奇数偶数バランスを整える役割
- 今回の組み合わせでは低数字帯を補完
- 31超の数字として分配リスクを意識するモードで評価
- 全体のレンジ分散を改善

## Dashboard

Required elements:

- 出現頻度ランキング
- 直近トレンド
- 数字間隔ランキング
- 奇数偶数分布
- 合計値レンジ
- 連番出現率
- 前回重複数
- 31超の出現傾向
- キャリーオーバー情報
- バックテスト概要

## Components

Implemented:

- AppShell
- HeroSection
- GameToggle
- StrategySelector
- StrategyCard
- TicketCard
- NumberBall
- ScoreRing
- ScoreBar
- InsightCard
- TrendBadge
- RiskNotice
- DataFreshnessBadge
- CarryoverCard
- BacktestSummaryCard
- NumberReasonPanel
- AdvancedSettingsPanel
- EmptyState
- LoadingSkeleton

