# Loto6 / Loto7 Latest Data Refresh

Date: 2026-07-31 09:00 JST

## Scope

- Retrieved the latest Loto6 / Loto7 results from Mizuho Bank's official CSVs and the sougaku history ZIPs.
- Reflected Loto6 draws 2123 and 2124 into processed JSON/CSV, analysis data, public download CSVs, and prediction inputs.
- Loto7 remains at draw 687; no newer Loto7 result was published at the time of this run.
- Regenerated the walk-forward backtest and the recent-120-draw portfolio validation used on the prediction page.

## Sources

- Mizuho Loto6 draw CSVs: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/A1022123.CSV`, `.../A1022124.CSV`
- Sougaku Loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`
- Sougaku Loto7 ZIP: `http://sougaku.com/loto7/download/loto7.zip`

## Latest Reflected Draws

### Loto6 2123

- Date: 2026-07-27
- Main numbers: 1, 2, 4, 25, 37, 40
- Bonus number: 43
- Sales amount: 1,634,886,600 yen (official source only)
- Carryover: 0 yen
- First prize: 2 winners, 293,335,100 yen
- Second prize: 8 winners, 10,323,100 yen
- Official draw CSV SHA-256: `ad8fc0c02775724362f660dc306fdeae609719638f39908409193fe6d0232fd2`

### Loto6 2124

- Date: 2026-07-30
- Main numbers: 6, 20, 29, 36, 37, 41
- Bonus number: 19
- Sales amount: 1,260,775,000 yen (official source only)
- Carryover: 219,914,692 yen
- First prize: 0 winners (carryover)
- Second prize: 8 winners, 8,247,000 yen
- Official draw CSV SHA-256: `4df37101e50fed9ab694b2a3eed3fb3b8725d51e77893c980c6591d48ca21ed6`
- Sougaku ZIP SHA-256: `69a0be5bb827a47b856ca172e735f440bdfcf7387a6029d51a25533ffafbc52c` (79,210 bytes)

### Loto7

- Latest available draw is still 687 (2026-07-24); the sougaku ZIP hash is unchanged
  (`7390f70b46245ee563dac3bf02f8e8480b5cd5e00bdb2b8b7f3b7bd12f57fcd6`, 30,470 bytes)
  and the official range remains 633-687. Nothing new to reflect this round.

## Pipeline

1. `npm run data:download` - downloaded and hashed the sougaku ZIP files.
2. `npm run data:official` - downloaded Mizuho official data (Loto6 range 2013-2124; Loto7 range 633-687).
3. `npm run data:parse` - parsed 2,124 Loto6 draws and 687 Loto7 draws.
4. `npm run data:compare` - regenerated source comparison reports.
5. `npm run data:analysis` - regenerated analysis JSON and CSV outputs.
6. `npm run data:downloads` - regenerated 10 public CSV download variants.
7. `npm run backtest` - regenerated the walk-forward summaries and details through Loto6 2124 / Loto7 687.
8. `npm run backtest:portfolio` - regenerated the recent-120-draw portfolio validation.

## Validation Notes

- Mizuho and sougaku agree on draw number, date, main numbers, bonus number, carryover, winners, and prize amounts for both new Loto6 draws.
- Source comparison marks rows `different` only because sougaku does not provide `salesAmount`; this is a known auxiliary-field coverage difference.
- Loto6 2123 hit the first prize (2 winners), clearing the carryover; 2124 rolled over again.
- Predictions are generated at runtime from `data/processed/*_draws.json`; the new draws are now part of the history passed to the generator.
- The update does not claim that historical data can guarantee or increase the probability of a future win.
