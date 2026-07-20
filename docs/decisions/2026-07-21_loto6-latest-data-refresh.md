# Loto6 Latest Data Refresh Decisions

Date: 2026-07-21

## Decisions

1. Treat Mizuho Bank's per-draw CSV as the authoritative confirmation source and the sougaku ZIP as the full-history ingestion source.
2. Accept the source-comparison difference for `salesAmount` because all primary result fields for draw 2121 match and the history source does not supply that auxiliary field.
3. Regenerate analysis, public downloads, walk-forward backtests, and portfolio validation so the prediction page and its validation explanation use a consistent data cutoff.
4. Keep the prediction algorithm and strategy weights unchanged. A new draw updates historical inputs but is not evidence that the scoring rules should be tuned to the latest outcome.
5. Preserve the existing safety framing: generated combinations are explainable reference selections based on past data, not winning guarantees.
6. Run the official download a second time after the ZIP download so the compatibility mirror under `data/raw/sougaku/` stores the newest retrieved archive.

## Rationale

- Cross-source agreement reduces the risk of reflecting a provisional or malformed result.
- Leaving strategy weights unchanged avoids tuning against a single newly observed draw.
- Walk-forward regeneration preserves the rule that each historical prediction uses only information available before its target draw.
- Recording both hashes and download artifacts makes the refresh reproducible and auditable.

