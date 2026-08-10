# Loto6 / Loto7 Latest Data Refresh

Date: 2026-08-11 06:00 JST

## Scope

- Retrieved the latest Loto6 / Loto7 results from Mizuho Bank's official CSVs and the sougaku history ZIPs.
- Reflected Loto6 draw 2127 into processed JSON/CSV, analysis data, public download CSVs, and prediction inputs.
- Loto7 remains at draw 689; no newer Loto7 result was published at the time of this run.
- Regenerated the walk-forward backtest and the recent-120-draw portfolio validation used on the prediction page.

## Sources

- Mizuho Loto6 draw CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/A1022127.CSV`
- Sougaku Loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`
- Sougaku Loto7 ZIP: `http://sougaku.com/loto7/download/loto7.zip`

## Latest Reflected Draws

### Loto6 2127

- Date: 2026-08-10 (月)
- Main numbers: 7, 12, 15, 29, 30, 33
- Bonus number: 22
- Sales amount: 1,516,759,000 yen (official source only)
- Carryover: 0 yen
- First prize: 1 winner, 408,302,200 yen
- Second prize: 5 winners, 14,706,900 yen
- Third prize: 357 winners, 222,400 yen
- Official draw CSV SHA-256: `b2e351fc5849f24399db3d8701ee27257b5b7915996ad9bf40f2ec82e7797285`
- Sougaku ZIP SHA-256: `5d9cf0f61846f9cc84620de57ed8cb5ab9c9de22f970db03ccd8d5966db23341` (79,321 bytes)

### Loto7

- Latest available draw is still 689 (2026-08-07); the sougaku ZIP hash is unchanged
  (`01e87259aad2d51fa807e2813f6c1aefd50e17718ea729694d4c9cc8895301f1`, 30,560 bytes)
  and the official range remains 637-689. Nothing new to reflect this round.

## Pipeline

1. `npm run data:download` - downloaded and hashed the sougaku ZIP files.
2. `npm run data:official` - downloaded Mizuho official data (Loto6 range 2022-2127; Loto7 range 637-689).
3. `npm run data:parse` - parsed 2,127 Loto6 draws and 689 Loto7 draws.
4. `npm run data:compare` - regenerated source comparison reports.
5. `npm run data:analysis` - regenerated analysis JSON and CSV outputs.
6. `npm run data:downloads` - regenerated 10 public CSV download variants.
7. `npm run backtest` - regenerated the walk-forward summaries and details through Loto6 2127 / Loto7 689.
8. `npm run backtest:portfolio` - regenerated the recent-120-draw portfolio validation (6 summary rows, 720 draw rows).

## Validation Notes

- Mizuho and sougaku agree on draw number, date, main numbers, bonus number, carryover, winners, and
  prize amounts for Loto6 2127 (all five tiers match exactly).
- Source comparison marks rows `different` only because sougaku does not provide `salesAmount`; this
  is a known auxiliary-field coverage difference.
- Loto6 2127 hit the first prize (1 winner, 408,302,200 yen) and the carryover is back to 0 yen.
- The Loto7 reference ticket plan in `artifacts/reports/purchase-plan-10000yen.html` targets draw 690
  (2026-08-14) and is unaffected by this Loto6-only update.
- Predictions are generated at runtime from `data/processed/*_draws.json`; the new draw is now part
  of the history passed to the generator.
- `npm test` (16 passed), `npm run typecheck`, and `npm run build` all succeeded.
- The update does not claim that historical data can guarantee or increase the probability of a future win.
