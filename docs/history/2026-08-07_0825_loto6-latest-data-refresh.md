# Loto6 / Loto7 Latest Data Refresh

Date: 2026-08-07 08:25 JST

## Scope

- Retrieved the latest Loto6 / Loto7 results from Mizuho Bank's official CSVs and the sougaku history ZIPs.
- Reflected Loto6 draw 2126 into processed JSON/CSV, analysis data, public download CSVs, and prediction inputs.
- Loto7 remains at draw 688; no newer Loto7 result was published at the time of this run.
- Regenerated the walk-forward backtest and the recent-120-draw portfolio validation used on the prediction page.

## Sources

- Mizuho Loto6 draw CSV: `https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/A1022126.CSV`
- Sougaku Loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`
- Sougaku Loto7 ZIP: `http://sougaku.com/loto7/download/loto7.zip`

## Latest Reflected Draws

### Loto6 2126

- Date: 2026-08-06 (木)
- Main numbers: 18, 20, 22, 35, 37, 42
- Bonus number: 24
- Sales amount: 1,610,491,000 yen (official source only)
- Carryover: 163,194,603 yen
- First prize: 1 winner, 600,000,000 yen
- Second prize: 4 winners, 20,492,900 yen
- Third prize: 240 winners, 368,800 yen
- Official draw CSV SHA-256: `336a4060db58ba65e7c1033a76c3bfb9b7988cf382ade51f17ff40fad5b0c9c4`
- Sougaku ZIP SHA-256: `713d895f3c9e2b71e9e1b2c4139f85952231b750102fbd6b3de9c982058977cf` (79,287 bytes)

### Loto7

- Latest available draw is still 688 (2026-07-31); the sougaku ZIP hash is unchanged
  (`199f9dee0dba16597e0e088cf17cd6e6d3c942869da91c9f88c93b571b401c13`, 30,515 bytes)
  and the official range remains 637-688. Nothing new to reflect this round.

## Pipeline

1. `npm run data:download` - downloaded and hashed the sougaku ZIP files.
2. `npm run data:official` - downloaded Mizuho official data (Loto6 range 2022-2126; Loto7 range 637-688).
3. `npm run data:parse` - parsed 2,126 Loto6 draws and 688 Loto7 draws.
4. `npm run data:compare` - regenerated source comparison reports.
5. `npm run data:analysis` - regenerated analysis JSON and CSV outputs.
6. `npm run data:downloads` - regenerated 10 public CSV download variants.
7. `npm run backtest` - regenerated the walk-forward summaries and details through Loto6 2126 / Loto7 688.
8. `npm run backtest:portfolio` - regenerated the recent-120-draw portfolio validation (6 summary rows, 720 draw rows).

## Validation Notes

- Mizuho and sougaku agree on draw number, date, main numbers, bonus number, carryover, winners, and
  prize amounts for Loto6 2126 (all five tiers match exactly this round).
- Source comparison marks rows `different` only because sougaku does not provide `salesAmount`; this
  is a known auxiliary-field coverage difference.
- Loto6 2126 hit the first prize (1 winner, 600,000,000 yen), clearing the previous carryover; the
  remaining carryover for the next draw is 163,194,603 yen.
- Predictions are generated at runtime from `data/processed/*_draws.json`; the new draw is now part
  of the history passed to the generator.
- `npm test` (16 passed), `npm run typecheck`, and `npm run build` all succeeded.
- The update does not claim that historical data can guarantee or increase the probability of a future win.
