# Data Pipeline Spec

Date: 2026-06-25 JST

## 目的

lotolotoを、ロト6ロト7の過去データ分析サイトとして運用できるように、公式確認データ、履歴データ、正規化データ、分析データ、公開CSVを分けて管理する。

## 入力ソース

### 公式確認ソース

- みずほ銀行 ロト6当せん番号案内
- みずほ銀行 ロト7当せん番号案内
- みずほ銀行 ロトバックナンバーCSV

保存先:

- `data/raw/official/loto6/`
- `data/raw/official/loto7/`

### 履歴ソース

- sougaku ロト6 ZIP
- sougaku ロト7 ZIP

保存先:

- `data/raw/sougaku/loto6/`
- `data/raw/sougaku/loto7/`
- 既存取得元の互換保存: `data/raw/loto6/`, `data/raw/loto7/`

## 正規化データ

保存先:

- `data/processed/loto6_draws.json`
- `data/processed/loto7_draws.json`
- `data/processed/loto6_draws.csv`
- `data/processed/loto7_draws.csv`

共通スキーマ:

- 回号
- 抽せん日
- 本数字
- ボーナス数字
- 販売実績額
- キャリーオーバー
- 等級別当せん口数
- 等級別当せん金額
- データソース
- 取得日時
- ソースハッシュ

## 公式照合

スクリプト:

- `scripts/download-official-loto-data.ts`
- `scripts/compare-loto-sources.ts`

出力:

- `data/quality/loto6_source_comparison.csv`
- `data/quality/loto7_source_comparison.csv`
- `data/quality/source-quality-report.md`

照合項目:

- 抽せん日
- 本数字
- ボーナス数字
- 販売実績額
- キャリーオーバー
- 等級別口数
- 等級別当せん金額

販売実績額など、片方のソースで未取得の項目は差分として記録する。サイトではデータソースと検証状態を表示する。

## 分析データ

スクリプト:

- `scripts/generate-analysis-data.ts`

出力:

- `data/analysis/loto6_analysis.json`
- `data/analysis/loto7_analysis.json`
- `data/analysis/loto6_number_frequency.csv`
- `data/analysis/loto7_number_frequency.csv`
- `data/analysis/loto6_recent100.csv`
- `data/analysis/loto7_recent100.csv`
- `data/analysis/loto6_carryover.csv`
- `data/analysis/loto7_carryover.csv`

分析項目:

- 最新回
- 直近30回の当せん一覧
- 数字別出現回数
- 直近30/50/100/300回の出現回数
- 未出現期間
- 平均出現間隔
- 最大未出現間隔
- 奇数偶数分布
- 合計値統計
- 連番分布
- 数字帯分布
- 末尾分布
- 前回数字との重複
- キャリーオーバー概要
- 等級別配当統計

## 公開CSV

スクリプト:

- `scripts/generate-download-csv.ts`

出力:

- `public/downloads/*.csv`
- `public/downloads/download-manifest.json`

BOM付きとBOMなしを両方生成する。Excelで開きやすい用途にはBOM付き、システム連携にはBOMなしを推奨する。

## 運用ルール

- 公式データで取得できる範囲は公式確認範囲として保存する。
- 全期間履歴はsougaku ZIPを履歴ソースとして保持する。
- 差分は隠さず品質レポートに出す。
- サイトでは「当せん保証」や「的中率アップ」を示さない。
- 購入や換金に関わる確認は公式情報を参照するよう明示する。
