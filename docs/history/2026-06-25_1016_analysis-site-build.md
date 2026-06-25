# Analysis Site Build Log

Date: 2026-06-25 10:16 JST

## Scope

Build lotoloto from a reference ticket generator into a Loto6/Loto7 historical data analysis site with CSV downloads, data quality reporting, methodology pages, and expert review content.

## Initial State

- Current branch before work: `work/friendly-light-ux-refresh`
- Git status: clean
- Existing app routes: only `src/app/page.tsx`
- Existing processed data:
  - `data/processed/loto6_draws.json`
  - `data/processed/loto6_draws.csv`
  - `data/processed/loto7_draws.json`
  - `data/processed/loto7_draws.csv`
- Existing raw source data:
  - `data/raw/loto6/loto6.zip`
  - `data/raw/loto7/loto7.zip`
  - extracted sougaku CSVs under `data/raw/loto6/extracted/` and `data/raw/loto7/extracted/`
- Existing backtest outputs:
  - `data/backtest/results/loto6_backtest_summary.json`
  - `data/backtest/results/loto7_backtest_summary.json`

## Plan

- Create branch `work/analysis-site-data-download`.
- Research official Mizuho/Takarakuji data source pages.
- Implement official fetch attempt and source comparison scripts.
- Generate analysis CSVs and public download CSVs.
- Add analysis-site navigation and pages.
- Preserve `/prediction` as the reference ticket generator page.
- Add methodology and expert review pages.
- Run tests, lint, build, HTTP checks, screenshots, and commit.

## Verification To Run

- `npm test`
- `npm run lint`
- `npm run build`
- Local HTTP checks for major routes

## Work Performed

- Created branch `work/analysis-site-data-download`.
- Researched Mizuho official Loto pages and CSV endpoints.
- Added official data downloader:
  - `src/loto/officialDownloader.ts`
  - `scripts/download-official-loto-data.ts`
- Added source comparison:
  - `src/loto/sourceComparison.ts`
  - `scripts/compare-loto-sources.ts`
- Added analysis generation:
  - `src/loto/analysis.ts`
  - `scripts/generate-analysis-data.ts`
- Added CSV export:
  - `src/loto/csvExport.ts`
  - `scripts/generate-download-csv.ts`
- Generated public CSV files under `public/downloads/`.
- Added analysis site routes:
  - `/`
  - `/loto6`
  - `/loto7`
  - `/loto6/results`
  - `/loto7/results`
  - `/loto6/statistics`
  - `/loto7/statistics`
  - `/loto6/patterns`
  - `/loto7/patterns`
  - `/downloads`
  - `/methodology`
  - `/expert-review`
  - `/prediction`
  - `/about`
- Preserved the reference ticket generator under `/prediction`.
- Added site navigation, footer, analysis cards, tables, data source badges, expert review cards, and download UI.
- Added recent 30 draw display to result pages.

## Data Fetch Results

- Mizuho official Loto6 CSV fetched successfully:
  - Official rows: 110
  - Range: draw 2004 to draw 2113
- Mizuho official Loto7 CSV fetched successfully:
  - Official rows: 54
  - Range: draw 629 to draw 682
- Sougaku history data remains the full-history source:
  - Loto6 processed rows: 2113
  - Loto7 processed rows: 682

## Data Quality Outputs

- `data/quality/loto6_source_comparison.csv`
- `data/quality/loto7_source_comparison.csv`
- `data/quality/source-quality-report.md`

The first comparison pass shows differences in all overlapping official rows, primarily because the processed history data has missing or different sales/prize-tier fields compared with official CSV. Main-number and date fields remain the priority for site display until item-level difference classification is expanded.

## Documentation Added

- `docs/research/official-data-source-research.md`
- `docs/data/data-pipeline-spec.md`
- `docs/data/csv-download-spec.md`
- `docs/design/analysis-site-ux.md`
- `docs/content/expert-review-content.md`
- `docs/reviews/2026-06-25_analysis-site-expert-panel.md`
- `docs/decisions/2026-06-25_analysis-site-decisions.md`

## Verification Results

- `npm test`: passed, 8 tests.
- `npm run lint`: passed, `tsc --noEmit`.
- `npm run build`: passed, 17 static app routes generated.
- Local HTTP 200 check passed:
  - `/`
  - `/loto6`
  - `/loto7`
  - `/loto6/results`
  - `/loto7/results`
  - `/loto6/statistics`
  - `/loto7/statistics`
  - `/loto6/patterns`
  - `/loto7/patterns`
  - `/downloads`
  - `/methodology`
  - `/expert-review`
  - `/prediction`
  - `/about`
  - `/downloads/loto6_draws_japanese_bom.csv`

## Screenshots

Saved under `artifacts/screenshots/`:

- `home.png`
- `loto6.png`
- `downloads.png`
- `expert-review-mobile.png`

## Commit Message Candidate

`feat: build loto analysis site with csv downloads`
