# Latest Loto Data Refresh Decision

Date: 2026-07-03 JST

## Decision

Use the refreshed sougaku ZIP data as the full-history source for processed draw data, and use refreshed Mizuho official CSV data as the verification source for the latest available official range.

## Rationale

- Existing pipeline uses sougaku ZIP as the normalized full-history source.
- Mizuho official CSV provides direct verification for the latest visible draw.
- Both sources agreed for loto6 draw 2116.
- Loto7 did not have a newer draw in the retrieved sources, so no new loto7 latest draw is reported.

## Safety

- This is historical result ingestion only.
- The update does not imply that future loto6 or loto7 numbers can be predicted.
- Any generated tickets remain reference combinations based on past data and explainable strategy themes.
