# Latest Loto Data Refresh

Date: 2026-07-11 16:27 JST

## Scope

- Refreshed official Mizuho data for loto6 and loto7.
- Refreshed sougaku ZIP data for loto6 and loto7.
- Reflected the newly available loto6 draw 2118 and loto7 draw 685 into processed data, analysis data, quality comparisons, and public download CSVs.
- Predictions (`/prediction`) are computed at runtime from the refreshed processed draws/analysis, so no separate prediction regeneration step is required.

## Sources

- Mizuho loto6 result page: `https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html`
- Mizuho loto7 result page: `https://www.mizuhobank.co.jp/takarakuji/check/loto/loto7/index.html`
- Sougaku loto6 ZIP: `http://sougaku.com/loto6/download/loto6.zip`
- Sougaku loto7 ZIP: `http://sougaku.com/loto7/download/loto7.zip`

## Latest Reflected Draws

### loto6
- Draw: 2118
- Date: 2026-07-09
- Main numbers: 1, 5, 8, 35, 36, 37
- Bonus number: 24
- Carryover: 482,140,962 yen
- Sougaku ZIP sha256: `4c699891bed2eb0d88e47572d3e45118f50cf7df84aca19f32aec0d72249e41f`
- Sougaku downloaded at: `2026-07-11T07:26:53.060Z`

### loto7
- Draw: 685
- Date: 2026-07-10
- Main numbers: 1, 5, 16, 20, 21, 22, 31
- Bonus numbers: 23, 36
- Carryover: 0 yen
- Sougaku ZIP sha256: `0727d7ed89b231185a3a06f195c9c60bbc0ca37c0f3a8143193e840b3a9014e3`
- Sougaku downloaded at: `2026-07-11T07:26:53.079Z`

## Pipeline

1. `npm run data:official` — Mizuho official CSV (loto6 range 2013-2118, loto7 range 633-685)
2. `npm run data:download` — sougaku ZIP
3. `npm run data:parse` — loto6 2118 draws, loto7 685 draws
4. `npm run data:compare` — source comparison refreshed
5. `npm run data:analysis` — analysis JSON/CSV regenerated
6. `npm run data:downloads` — 10 public download files regenerated

## Validation

- `npm test` — 10 passed
- `npm run typecheck` — passed
- `npm run build` — passed

## Notes

- Main numbers and dates matched between Mizuho official and sougaku sources for the new draws.
- No prediction guarantee or winning-probability wording was added.
