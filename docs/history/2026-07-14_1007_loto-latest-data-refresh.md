# Latest Loto Data Refresh

Date: 2026-07-14 10:07 JST

## Scope

- Refreshed official Mizuho data for loto6 and loto7.
- Refreshed sougaku ZIP data for loto6 and loto7.
- Reflected the newly available loto6 draw 2119 into processed data, analysis data, quality comparisons, and public download CSVs.
- Confirmed loto7 remains at draw 685 in the retrieved sources (next draw falls on the following Friday).
- Predictions (`/prediction`) are computed at runtime from the refreshed processed draws/analysis, so no separate prediction regeneration step is required.

## Sources

- Mizuho loto6 result page: `https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html`
- Mizuho loto7 result page: `https://www.mizuhobank.co.jp/takarakuji/check/loto/loto7/index.html`
- Sougaku loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`
- Sougaku loto7 ZIP: `http://sougaku.com/loto7/download/loto7.zip`

## Latest Reflected Draw

- Game: loto6
- Draw: 2119
- Date: 2026-07-13
- Main numbers: 15, 18, 20, 22, 30, 38
- Bonus number: 42
- Carryover: 177,434,948 yen
- Sougaku ZIP sha256: `70e5ae32f061f88a0db314404f828e806fba9bc8b79224ddce5ec341e2ba2cb9`

## Loto7 Status

- Latest available draw remains 685 (2026-07-10).
- Sougaku loto7 ZIP sha256 unchanged: `0727d7ed89b231185a3a06f195c9c60bbc0ca37c0f3a8143193e840b3a9014e3`

## Pipeline

1. `npm run data:official` — Mizuho official CSV (loto6 range 2013-2119, loto7 range 633-685)
2. `npm run data:download` — sougaku ZIP
3. `npm run data:parse` — loto6 2119 draws, loto7 685 draws
4. `npm run data:compare` — source comparison refreshed
5. `npm run data:analysis` — analysis JSON/CSV regenerated
6. `npm run data:downloads` — 10 public download files regenerated

## Validation

- `npm test` — 10 passed
- `npm run typecheck` — passed
- `npm run build` — passed

## Notes

- Main numbers and dates matched between Mizuho official and sougaku sources for the new draw.
- No prediction guarantee or winning-probability wording was added.
