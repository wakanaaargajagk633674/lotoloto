# Official Data Source Research

Date: 2026-06-25 JST

## 調査対象

- 宝くじ公式サイト 当せん番号案内
- みずほ銀行 ロト6 当せん番号案内
- みずほ銀行 ロト7 当せん番号案内
- みずほ銀行 ロト系バックナンバー
- sougaku公開ZIPデータ

## 確認した公式URL

- 宝くじ公式 当せん番号案内: `https://www.takarakuji-official.jp/check/`
- みずほ銀行 ロト6: `https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html`
- みずほ銀行 ロト7: `https://www.mizuhobank.co.jp/takarakuji/check/loto/loto7/index.html`
- みずほ銀行 バックナンバー: `https://www.mizuhobank.co.jp/takarakuji/check/loto/backnumber/index.html`

## CSVエンドポイント

みずほ銀行ページ内のロト表示JSから、以下のCSV取得規則を確認した。

- 最新一覧CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/{type}/csv/{type}.csv`
- 個別回CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/{type}/csv/A10{prefix}{drawNumber}.CSV`
- `type`: `loto6` または `loto7`
- `prefix`: ロト6は `2`、ロト7は `3`

例:

- ロト6 第2113回: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/A1022113.CSV`
- ロト7 第682回: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto7/csv/A1030682.CSV`

## 取得結果

`scripts/download-official-loto-data.ts` でNode fetchにより取得した。PowerShell `Invoke-WebRequest` では403になるケースがあったため、アプリ側取得はNode fetchを採用した。

- ロト6: 公式CSV 110回分を取得。範囲は第2004回から第2113回。
- ロト7: 公式CSV 54回分を取得。範囲は第629回から第682回。

保存先:

- `data/raw/official/loto6/`
- `data/raw/official/loto7/`

## sougaku履歴データ

過去全期間の履歴データは、既存パイプラインで取得済みのsougaku公開ZIPを正規化して利用する。

- ロト6: 2113回分
- ロト7: 682回分

保存先:

- `data/raw/sougaku/loto6/`
- `data/raw/sougaku/loto7/`
- `data/processed/loto6_draws.json`
- `data/processed/loto7_draws.json`

## 照合結果

`scripts/compare-loto-sources.ts` で公式CSVと正規化履歴データを回号単位で照合した。

- ロト6: 公式110件、重複110件、差分110件
- ロト7: 公式54件、重複54件、差分54件

差分は主に、正規化済みsougaku履歴データ側で販売実績額や一部等級別口数が未取得または形式差を持つことによる。サイト表示では本数字、ボーナス数字、抽せん日を優先し、販売実績額、キャリーオーバー、配当は取得状態を明示する。

詳細:

- `data/quality/loto6_source_comparison.csv`
- `data/quality/loto7_source_comparison.csv`
- `data/quality/source-quality-report.md`

## 採用判断

- 最新確認: みずほ銀行公式CSVを取得し、取得範囲を公式確認範囲として扱う。
- 全期間履歴: sougaku公開ZIPを履歴ソースとして保持する。
- 照合: 重複期間の差分を品質レポートに出し、サイト上でもデータソースと検証状態を表示する。
- 注意: 公式確認できる範囲外は、履歴データとして表示し、購入や換金に関わる判断では公式情報確認を促す。
