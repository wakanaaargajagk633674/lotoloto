# Loto6 / Loto7 Latest Data Refresh

Date: 2026-07-25 08:30 JST

## Scope

- Retrieved the latest Loto6 and Loto7 results from Mizuho Bank's official CSVs and the sougaku history ZIPs.
- Reflected Loto6 draw 2122 and Loto7 draw 687 into processed JSON/CSV, analysis data, public download CSVs, and prediction inputs.
- Regenerated the walk-forward backtest and the recent-120-draw portfolio validation used on the prediction page.

## Sources

- Mizuho Loto6 draw CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/A1022122.CSV`
- Mizuho Loto7 draw CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto7/csv/A1030687.CSV`
- Sougaku Loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`
- Sougaku Loto7 ZIP: `http://sougaku.com/loto7/download/loto7.zip`

## Latest Reflected Draws

### Loto6

- Draw: 2122
- Date: 2026-07-23
- Main numbers: 12, 15, 18, 21, 26, 32
- Bonus number: 41
- Sales amount: 1,406,261,200 yen (official source only)
- Carryover: 311,395,743 yen
- First prize: 0 winners (carryover)
- Second prize: 8 winners, 8,735,200 yen
- Official draw CSV SHA-256: `d70dfc3a4d2c81eb4a6bb9264e30d357a507b71d029bfb6df5c3c9e56956e032`
- Sougaku ZIP SHA-256: `4aa898cdc9d14da1317bb86073ed666a8add2e83d6b637f011ce082d7fde545b`

### Loto7

- Draw: 687
- Date: 2026-07-24
- Main numbers: 15, 22, 23, 24, 25, 29, 36
- Bonus numbers: 35, 37
- Sales amount: 1,993,688,400 yen (official source only)
- Carryover: 840,886,345 yen
- First prize: 0 winners (carryover)
- Second prize: 4 winners, 13,731,000 yen
- Official draw CSV SHA-256: `04d9a2d9bf2d64bd8e97174fef25c6a6ad9c9e074ee1cdd9d93679f21789b29f`
- Sougaku ZIP SHA-256: `7390f70b46245ee563dac3bf02f8e8480b5cd5e00bdb2b8b7f3b7bd12f57fcd6`

## Pipeline

1. `npm run data:download` - downloaded and hashed the sougaku ZIP files (loto6 79,137 bytes; loto7 30,470 bytes).
2. `npm run data:official` - downloaded Mizuho official data (Loto6 range 2013-2122; Loto7 range 633-687).
3. `npm run data:parse` - parsed 2,122 Loto6 draws and 687 Loto7 draws.
4. `npm run data:compare` - regenerated source comparison reports.
5. `npm run data:analysis` - regenerated analysis JSON and CSV outputs.
6. `npm run data:downloads` - regenerated 10 public CSV download variants.
7. `npm run backtest` - regenerated the full walk-forward summaries and details through Loto6 2122 / Loto7 687.
8. `npm run backtest:portfolio` - regenerated six recent-120-draw portfolio validation summaries and 720 detail rows.

## Validation Notes

- Mizuho and sougaku agree on draw number, date, main numbers, bonus numbers, carryover, winners, and prize amounts for both new draws.
- Source comparison marks rows `different` only because sougaku does not provide `salesAmount`; this is a known auxiliary-field coverage difference.
- Both games rolled over the first prize this round, so the carryover amounts increased for the next draws.
- Main and compatibility-mirror ZIP hashes match for both games (`data/raw/<game>/` and `data/raw/sougaku/<game>/`).
- Predictions are generated at runtime from `data/processed/*_draws.json`; the new draws are now part of the history passed to the generator.
- The combined backtest command exceeded the default command timeout and was run to completion in the background; both scripts exited successfully.
- The update does not claim that historical data can guarantee or increase the probability of a future win.
- `npm test` - 10 tests passed.
- `npm run typecheck` - passed.
- `npm run build` - passed; all static routes, including `/prediction`, were generated.
