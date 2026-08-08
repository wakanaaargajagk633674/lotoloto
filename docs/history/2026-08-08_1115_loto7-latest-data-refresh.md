# Loto6 / Loto7 Latest Data Refresh

Date: 2026-08-08 11:15 JST

## Scope

- Retrieved the latest Loto6 / Loto7 results from Mizuho Bank's official CSVs and the sougaku history ZIPs.
- Reflected Loto7 draw 689 into processed JSON/CSV, analysis data, public download CSVs, and prediction inputs.
- Loto6 remains at draw 2126; no newer Loto6 result was published at the time of this run.
- Regenerated the walk-forward backtest and the recent-120-draw portfolio validation used on the prediction page.

## Sources

- Mizuho Loto7 draw CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto7/csv/A1030689.CSV`
- Sougaku Loto7 ZIP: `http://sougaku.com/loto7/download/loto7.zip`
- Sougaku Loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`

## Latest Reflected Draws

### Loto7 689

- Date: 2026-08-07 (金)
- Main numbers: 4, 18, 23, 24, 32, 33, 35
- Bonus numbers: 29, 36
- Sales amount: 2,402,126,400 yen (official source only)
- Carryover: 727,107,220 yen
- First prize: 1 winner, 1,200,000,000 yen
- Second prize: 7 winners, 9,453,700 yen
- Third prize: 133 winners, 573,100 yen
- Official draw CSV SHA-256: `699091b95c64e9e42d167e0fc07df3c90d6caa9a6063ec39e5ee9a0ac3a2b909`
- Sougaku ZIP SHA-256: `01e87259aad2d51fa807e2813f6c1aefd50e17718ea729694d4c9cc8895301f1` (30,560 bytes)

### Loto6

- Latest available draw is still 2126 (2026-08-06); the sougaku ZIP hash is unchanged
  (`713d895f3c9e2b71e9e1b2c4139f85952231b750102fbd6b3de9c982058977cf`, 79,287 bytes)
  and the official range remains 2022-2126. Nothing new to reflect this round.

## Pipeline

1. `npm run data:download` - downloaded and hashed the sougaku ZIP files.
2. `npm run data:official` - downloaded Mizuho official data (Loto6 range 2022-2126; Loto7 range 637-689).
3. `npm run data:parse` - parsed 2,126 Loto6 draws and 689 Loto7 draws.
4. `npm run data:compare` - regenerated source comparison reports.
5. `npm run data:analysis` - regenerated analysis JSON and CSV outputs.
6. `npm run data:downloads` - regenerated 10 public CSV download variants.
7. `npm run backtest` - regenerated the walk-forward summaries and details through Loto6 2126 / Loto7 689.
8. `npm run backtest:portfolio` - regenerated the recent-120-draw portfolio validation (6 summary rows, 720 draw rows).

## Validation Notes

- Mizuho and sougaku agree on draw number, date, main numbers, bonus numbers, carryover, winners, and
  prize amounts for Loto7 689 (all six tiers match exactly).
- Source comparison marks rows `different` only because sougaku does not provide `salesAmount`; this
  is a known auxiliary-field coverage difference.
- Loto7 689 hit the first prize (1 winner, 1,200,000,000 yen); the carryover for the next draw is
  727,107,220 yen.
- Predictions are generated at runtime from `data/processed/*_draws.json`; the new draw is now part
  of the history passed to the generator.
- `npm test` (16 passed), `npm run typecheck`, and `npm run build` all succeeded.
- The update does not claim that historical data can guarantee or increase the probability of a future win.
