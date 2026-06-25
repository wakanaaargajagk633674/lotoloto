# UX Language Refresh Log

Date: 2026-06-25 08:53 JST

## Scope

User requested a terminology refresh and UX redesign for LOTOLOTO Intelligence.

## Git

- Started from clean branch: `work/initial-lotoloto-foundation`
- Created branch: `work/ux-language-refresh`
- Previous commit: `3435ca3 feat: initialize lotoloto foundation`

## Terminology Changes

- Replaced product-facing and code-facing old candidate-removal terminology with:
  - 候補調整
  - パターンフィルター
  - 低優先候補
  - 組み合わせバランス
  - Candidate Tuning
  - Pattern Filter
  - Avoidance Signal
- Strategy IDs changed:
  - `frequent` -> `hot_trend`
  - `overdue` -> `deep_gap`
  - `high_payout` -> `high_return`
  - `random` -> `pure_random`
  - `sougaku_delete` -> `pattern_filter`
  - `mixed` -> `smart_mix`
- Feature names changed:
  - `deletionCandidateScore` -> `candidateAdjustmentScore`
  - `sougakuDeletionScore` -> `sourcePatternSignalScore`
  - `sougakuPartitionScore` -> `sourcePatternBalanceScore`
  - `deletionRiskScore` -> `lowPrioritySignalScore`

## UX Changes

- Rebuilt UI around `LOTOLOTO Intelligence`.
- Added dark intelligence dashboard theme.
- Added hero, game toggle, strategy cards, advanced settings, ticket cards, number balls, score bars, score ring, reason panel, insight dashboard, carryover and backtest cards.
- Made caution copy visible and natural.

## Verification

- `npm run backtest`: passed. Regenerated `data/backtest/results/*` and `docs/backtest/backtest-report.md` with the new strategy IDs.
- `npm test`: passed. 8 tests passed.
- `npm run lint`: passed. `tsc --noEmit` completed.
- `npm run build`: passed. Next.js production build completed.
- Local app check: `http://127.0.0.1:3000` returned HTTP 200.
- Terminology search: no old candidate-removal terms remained in `src`, `tests`, `scripts`, `AGENTS.md`, `docs/algorithm`, `docs/design`, `docs/skills`, or `docs/backtest`.

## Commit Message Candidate

`feat: refresh lotoloto UX language and dashboard`
