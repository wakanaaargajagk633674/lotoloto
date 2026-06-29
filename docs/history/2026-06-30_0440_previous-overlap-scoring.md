# Previous Overlap Scoring Implementation

Date: 2026-06-30 04:40 JST

## Scope

- Added previous-draw main-number overlap as a soft combination-level signal for generated tickets.
- Kept the signal separate from number-level prediction, because observed overlap rates are close to random-combination expectations.
- Added ticket card display for previous-draw overlap count and historical distribution rate.
- Added unit coverage for common versus extreme previous-overlap scoring.

## Implementation Notes

- `CombinationScores` now includes previous-draw overlap rate, score, and band.
- `scoreCombination` derives the empirical overlap distribution only from available history.
- If history is too short, scoring falls back to combination-theory rates.
- Strategy-specific weights are managed in `src/config/strategyWeights.ts`.
- Candidate selection applies only a small penalty for extreme overlap counts.

## Product Safety

- The feature is described as a historical-pattern reference and an extreme-ticket check.
- It does not claim that carrying over previous numbers improves winning probability.
- It does not hard-filter tickets by previous-draw overlap.
