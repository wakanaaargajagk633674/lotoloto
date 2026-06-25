# Public Content Simplification Log

Date: 2026-06-25 11:06 JST

## User Feedback

- This is a public page for visitors.
- Visitors do not need internal or technical details such as data source, verification status, row count, or construction-oriented expert review.
- Methodology-style internal explanations should not be public-facing.
- Expert-review content was intended as construction guidance, not public page content.

## Changes

- Removed public navigation links to methodology and expert-review pages.
- Removed `/methodology` and `/expert-review` public routes.
- Removed internal data-source, verification-status, row-count, and quality-report references from public pages.
- Simplified `/downloads` into visitor-facing CSV cards with only:
  - title
  - plain-language description
  - Excel向けCSV button
  - 通常CSV link
- Removed internal columns from downloadable all-draw CSV:
  - データソース
  - 取得日時
  - 検証状態
- Updated the home page to focus on:
  - Loto6 analysis
  - Loto7 analysis
  - latest results
  - carryover overview
  - CSV save
  - reference ticket generator
- Kept internal research, source comparison, and expert review records in docs/data/docs/reviews only.

## Verification

- `npm test`: passed.
- `npm run lint`: passed after clearing stale `.next` types.
- `npm run build`: passed, public static routes reduced from 17 to 15.
- HTTP check:
  - `/`: 200
  - `/loto6`: 200
  - `/loto7`: 200
  - `/downloads`: 200
  - `/prediction`: 200
  - `/about`: 200
  - `/methodology`: 404
  - `/expert-review`: 404
- Updated screenshots:
  - `artifacts/screenshots/home.png`
  - `artifacts/screenshots/downloads.png`
  - `artifacts/screenshots/home-mobile.png`

## Commit Message Candidate

`fix: simplify public loto analysis content`
