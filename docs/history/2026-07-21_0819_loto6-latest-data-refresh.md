# Loto6 Latest Data Refresh

Date: 2026-07-21 08:19 JST

## Scope

- Retrieved the latest Loto6 result from Mizuho Bank's official CSV and the sougaku history ZIP.
- Reflected Loto6 draw 2121 into processed JSON/CSV, analysis data, public download CSVs, and prediction inputs.
- Regenerated the walk-forward backtest and the recent-120-draw portfolio validation used on the prediction page.
- Refreshed Loto7 sources through the shared pipeline; its latest draw remains 686.

## Sources

- Mizuho Loto6 result page: `https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html`
- Mizuho Loto6 draw CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/A1022121.CSV`
- Sougaku Loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`

## Latest Reflected Draw

- Game: loto6
- Draw: 2121
- Date: 2026-07-20
- Main numbers: 1, 3, 10, 17, 25, 26
- Bonus number: 36
- Sales amount: 1,694,990,200 yen (official source only)
- Carryover: 78,463,295 yen
- First prize: 1 winner, 600,000,000 yen
- Official draw CSV SHA-256: `f3350b8b3c044f129af93bbd1c41e357c70834ce65e5966a651c2f0a4aa15353`
- Sougaku ZIP SHA-256: `f0f8f7877085ca8f0be66720507328033a248a6b197dec9e8c0aa9996c7ad946`

## Pipeline

1. `npm run data:official` - downloaded Mizuho official data (Loto6 range 2013-2121; Loto7 range 633-686).
2. `npm run data:download` - downloaded and hashed the sougaku ZIP files.
3. `npm run data:parse` - parsed 2,121 Loto6 draws and 686 Loto7 draws.
4. `npm run data:compare` - regenerated source comparison reports.
5. `npm run data:analysis` - regenerated analysis JSON and CSV outputs.
6. `npm run data:downloads` - regenerated 10 public CSV download variants.
7. `npm run backtest` - regenerated the full walk-forward summaries and details through draw 2121.
8. `npm run backtest:portfolio` - regenerated six recent-120-draw portfolio validation summaries and 720 detail rows.
9. Re-ran `npm run data:official` after the ZIP download so `data/raw/sougaku/` mirrors the newly downloaded ZIP rather than the prior local ZIP.

## Validation Notes

- Mizuho and sougaku agree on draw number, date, main numbers, bonus number, carryover, winners, and prize amounts for draw 2121.
- Source comparison marks the row `different` only because sougaku does not provide `salesAmount`; this is a known auxiliary-field coverage difference.
- The first combined backtest command exceeded its 120-second command limit. Running the full backtest and portfolio validation separately with extended limits completed successfully.
- Predictions are generated at runtime from `data/processed/loto6_draws.json`; the latest draw is now part of the history passed to the generator.
- The update does not claim that historical data can guarantee or increase the probability of a future win.
- Main and compatibility-mirror Loto6 ZIP hashes match: `f0f8f7877085ca8f0be66720507328033a248a6b197dec9e8c0aa9996c7ad946`.
- `npm test` - 10 tests passed.
- `npm run typecheck` - passed.
- `npm run build` - passed; all 15 static routes, including `/prediction`, were generated.
