# Loto latest data refresh

- Date: 2026-07-04 14:24 JST
- Task: 最新回のロトデータを取得し、加工済みデータ、分析データ、公開用CSVへ反映

## Updated draws

| Game | Latest draw | Draw date | Main numbers | Bonus numbers | Status |
| --- | ---: | --- | --- | --- | --- |
| loto6 | 2116 | 2026-07-02 | 2, 6, 13, 14, 20, 42 | 10 | 変更なし、再取得確認 |
| loto7 | 684 | 2026-07-03 | 8, 14, 17, 19, 20, 32, 36 | 21, 25 | 新規反映 |

## Sources

- Official Mizuho loto6 result page: https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html
- Official Mizuho loto7 result page: https://www.mizuhobank.co.jp/takarakuji/check/loto/loto7/index.html
- Sougaku ZIP loto6 hash: `ce58b614e8b8b2cc5f5b4642519a6ab2dbeef323a42c3e129247b4efcaa88500`
- Sougaku ZIP loto7 hash: `d596ab88a6f2770bfc548852566c5481d9875faee66569d0248c47d72af5e7c4`
- Download timestamp: `2026-07-04T05:23:17Z` range

## Work performed

- Ran official data download and stored new official loto7 draw files for draw 684.
- Rebuilt processed JSON/CSV data for loto6 and loto7.
- Regenerated analysis JSON/CSV and public download CSV files.
- Updated source quality comparison outputs.
- Confirmed latest loto7 processed and official rows match for draw number, date, main numbers, bonus numbers, carryover, and prize tiers.

## Notes

- `data/quality/source-quality-report.md` still reports all overlapping rows as different because comparison includes auxiliary fields such as official sales amount and missing weekday data. Main numbers and dates remain the display priority.
- ロト6・ロト7はランダム抽せんであり、今回の更新は過去データの反映であって将来の当せんを保証するものではない。
