# Task Log 2026-06-27 11:39 JST

## Scope

- User reported buying Loto6 20 tickets and Loto7 10 tickets, with only one winning result.
- Requested roughly three logic validation loops, 50 expert opinions, and web/X research into winner methods.

## Safety Constraint

- No winning guarantee or probability-improvement guarantee was introduced.
- Work framed as historical walk-forward validation, portfolio diversification, and explanation improvement.

## Research

- Web sources checked:
  - Mizuho Loto rules
  - Takarakuji official Loto6/Loto7 product descriptions
  - Rakuten Bank Loto6/Loto7 odds and purchase-method pages
  - Rakuten Lottery frequency-analysis page
- Hermes X search:
  - `ロト7 当選 買い方 クイックピック 継続`: success, URL-backed weak signals
  - `ロト6 高額当選 番号 選び方`: success, URL-backed weak signals
  - `ロト6 当選 買い方 クイックピック 継続`: failed with 429 rate limit

## Implementation

- Updated `src/loto/generator.ts`
  - Added multi-ticket portfolio spread controls:
    - number reuse penalty
    - pair reuse penalty
    - range-profile reuse penalty
  - Added tiny Loto6-only soft signals:
    - historical pair co-occurrence
    - high-return sum band
  - Adjusted `smart_mix` expansion by game:
    - Loto6: more random/high-return spread
    - Loto7: reverted to baseline-style scoring after validation rejected extra additions
- Updated `tests/loto.test.ts`
  - Added duplicate-ticket regression for 20-ticket portfolios.
- Added `scripts/run-portfolio-validation.ts`
- Added `npm run backtest:portfolio`

## Validation Loops

- Baseline saved to `data/backtest/loop-validation/baseline`
- Loop 1 saved to `data/backtest/loop-validation/loop1_portfolio`
- Loop 2 saved to `data/backtest/loop-validation/loop2_smart-mix-randomized`
- Loop 3 adopted version saved to `data/backtest/loop-validation/loop3_game-aware-mix`

Key full-history smart_mix result:

- Loto6 baseline prize hits: `37`
- Loto6 loop3 prize hits: `57`
- Loto7 baseline prize hits: `29`
- Loto7 loop3 prize hits: `29`

Portfolio validation:

- Loto6: 20 tickets x 120 target draws
- Loto7: 10 tickets x 120 target draws
- Results saved to `data/backtest/portfolio-validation/summary.json` and `.csv`

## Documentation

- `docs/research/2026-06-27_loto-method-research.md`
- `docs/backtest/logic-loop-validation-2026-06-27.md`
- `docs/backtest/portfolio-validation-report.md`
- `docs/decisions/2026-06-27_logic-validation-decisions.md`
- `docs/reviews/2026-06-27_loto-logic-50-expert-panel.md`
- `artifacts/reports/loto-logic-validation-2026-06-27.html`

## Verification

Completed:

- `npm test`: passed, 9 tests
- `npm run typecheck`: passed
- `npm run backtest`: passed
- `npm run backtest:portfolio`: passed
- `npm run build`: passed, 15 static routes generated
