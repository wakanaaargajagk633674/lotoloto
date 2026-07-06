# Loto latest data refresh

- Date: 2026-07-07 06:49 JST
- Task: 最新回のロトデータを取得し、加工済みデータ、分析データ、公開用CSVへ反映

## Updated draws

| Game | Latest draw | Draw date | Main numbers | Bonus numbers | Status |
| --- | ---: | --- | --- | --- | --- |
| loto6 | 2117 | 2026-07-06 | 4, 7, 26, 27, 35, 41 | 34 | 新規反映 |
| loto7 | 684 | 2026-07-03 | 8, 14, 17, 19, 20, 32, 36 | 21, 25 | 変更なし、再取得確認 |

## Sources

- Official Mizuho loto6 result page: https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html
- Official Mizuho loto7 result page: https://www.mizuhobank.co.jp/takarakuji/check/loto/loto7/index.html
- Sougaku ZIP loto6 hash: `6095b1b1e30c8bf20c68680d665122e99fec6b497d4ecab72bfdf53ac2e36847`
- Sougaku ZIP loto7 hash: `d596ab88a6f2770bfc548852566c5481d9875faee66569d0248c47d72af5e7c4`

## Work performed

- Ran sougaku and official data downloads; stored new official loto6 draw files for draw 2117.
- Rebuilt processed JSON/CSV data for loto6 (2117 draws) and loto7 (684 draws).
- Regenerated analysis JSON/CSV and public download CSV files (10 files).
- Updated source quality comparison outputs.
- Passed `npm test` (10 tests), `npm run typecheck`, and `npm run build`.

## Notes

- ロト6・ロト7はランダム抽せんであり、今回の更新は過去データの反映であって将来の当せんを保証するものではない。
