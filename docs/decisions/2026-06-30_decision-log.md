# Decision Log

Date: 2026-06-30 JST

## Loto6 Draw 2115 Data Refresh

Decision: Use the refreshed sougaku ZIP as the full-history source for `data/processed/loto6_draws.*`, while retaining the refreshed Mizuho official CSV range under `data/raw/official/loto6` for verification.

Reasoning:

- Existing pipeline treats sougaku ZIP as the normalized full-history source.
- Mizuho official CSV provides a reliable recent-window verification source and direct draw CSV for draw 2115.
- Both sources agreed on the latest draw identifiers and winning numbers for draw 2115.
- Keeping the same source split avoids changing historical semantics during a narrow data refresh.

Operational outcome:

- `data/raw/loto6/loto6.zip` and `data/raw/loto6/extracted/loto6.csv` were refreshed.
- `data/raw/sougaku/loto6/` was mirrored from the refreshed raw ZIP/CSV.
- `data/raw/official/loto6/` was refreshed through draw 2115.
- Derived processed, analysis, public downloads, and quality comparison outputs were regenerated.

Safety note:

- The update is historical result ingestion only. It does not imply any ability to predict future loto6 numbers.
