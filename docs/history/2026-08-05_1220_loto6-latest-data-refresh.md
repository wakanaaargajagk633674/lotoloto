# Loto6 / Loto7 Latest Data Refresh

Date: 2026-08-05 12:20 JST

## Scope

- Retrieved the latest Loto6 / Loto7 results from Mizuho Bank's official CSVs and the sougaku history ZIPs.
- Reflected Loto6 draw 2125 into processed JSON/CSV, analysis data, public download CSVs, and prediction inputs.
- Loto7 remains at draw 688 (already reflected in the previous run); no newer Loto7 result was published at the time of this run.
- Regenerated the walk-forward backtest and the recent-120-draw portfolio validation used on the prediction page.

## Sources

- Mizuho Loto6 draw CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/A1022125.CSV`
- Sougaku Loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`
- Sougaku Loto7 ZIP: `http://sougaku.com/loto7/download/loto7.zip`

## Latest Reflected Draws

### Loto6 2125

- Date: 2026-08-03 (月)
- Main numbers: 3, 22, 25, 28, 30, 43
- Bonus number: 39
- Sales amount: 1,608,222,400 yen (official source only)
- Carryover: 489,963,936 yen
- First prize: 0 winners (carryover)
- Second prize: 7 winners, 11,573,900 yen
- Third prize: 241 winners, 363,000 yen
- Official draw CSV SHA-256: `373a4c0142e03b808b673634d...` (see `data/raw/official/loto6/official_draws.json`)
- Sougaku ZIP SHA-256: `b9fbc72d1c4bc99afc3b5c6fbbb557c2a00876066dca086aa8257942f80802d3` (79,246 bytes)

### Loto7

- Latest available draw is still 688 (2026-07-31). The sougaku ZIP hash changed to
  `199f9dee0dba16597e0e088cf17cd6e6d3c942869da91c9f88c93b571b401c13` (30,515 bytes) but the
  official range remains 637-688, so no new Loto7 draw was added this round.

## Pipeline

1. `npm run data:download` - downloaded and hashed the sougaku ZIP files.
2. `npm run data:official` - downloaded Mizuho official data (Loto6 range 2022-2125; Loto7 range 637-688).
3. `npm run data:parse` - parsed 2,125 Loto6 draws and 688 Loto7 draws.
4. `npm run data:compare` - regenerated source comparison reports.
5. `npm run data:analysis` - regenerated analysis JSON and CSV outputs.
6. `npm run data:downloads` - regenerated 10 public CSV download variants.
7. `npm run backtest` - regenerated the walk-forward summaries and details through Loto6 2125 / Loto7 688.
8. `npm run backtest:portfolio` - regenerated the recent-120-draw portfolio validation (6 summary rows, 720 draw rows).

## Validation Notes

- Mizuho and sougaku agree on draw number, date, main numbers, bonus number, carryover, and the
  first through fourth prize tiers for Loto6 2125.
- Fifth-prize winner counts differ slightly for 2125 (official 192,682 vs sougaku 192,692); the
  processed data keeps the sougaku history value, consistent with prior draws. The difference does
  not affect main numbers, analysis features, or predictions.
- Source comparison marks rows `different` mainly because sougaku does not provide `salesAmount`;
  this is a known auxiliary-field coverage difference.
- Loto6 2125 produced no first-prize winner, so the carryover grew to 489,963,936 yen.
- Predictions are generated at runtime from `data/processed/*_draws.json`; the new draw is now part
  of the history passed to the generator.
- `npm test` (16 passed), `npm run typecheck`, and `npm run build` all succeeded.
- The update does not claim that historical data can guarantee or increase the probability of a future win.
