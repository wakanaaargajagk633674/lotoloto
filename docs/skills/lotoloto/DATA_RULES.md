# Data Rules

## Sources

- Primary regular source: `http://sougaku.com/loto6/download/loto6.zip`
- Primary regular source: `http://sougaku.com/loto7/download/loto7.zip`
- Keep the source URLs in code even when a download fails, so future runs can retry.

## Raw Storage

- Save ZIP files to:
  - `data/raw/loto6/loto6.zip`
  - `data/raw/loto7/loto7.zip`
- Extract to:
  - `data/raw/loto6/extracted/`
  - `data/raw/loto7/extracted/`
- Save download metadata including SHA-256, bytes, URL, entries, and timestamp.

## Parsing

- Detect UTF-8 first, then Shift_JIS/CP932.
- Normalize each draw to common `Draw` fields:
  - game, drawNumber, drawDate, mainNumbers, bonusNumbers
  - salesAmount when available
  - carryoverAmount
  - prizeTiers
  - source, sourceDownloadedAt, sourceHash
- If a field is unavailable, store `null` and document the reason.
- Validate ranges and duplicate numbers.

## Processed Storage

- Write:
  - `data/processed/loto6_draws.json`
  - `data/processed/loto7_draws.json`
  - `data/processed/loto6_draws.csv`
  - `data/processed/loto7_draws.csv`

## Failure Handling

- Try HTTP, HTTPS, User-Agent changes, timeout changes, and direct ZIP fetch.
- If still blocked, record attempts in `docs/research/sougaku-access-log.md`.
- Use existing raw/processed local files only with an explicit note that the fetch failed.

