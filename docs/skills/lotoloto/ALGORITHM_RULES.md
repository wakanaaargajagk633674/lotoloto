# Algorithm Rules

## Positioning

The app is an explainable reference-ticket generator, not a winning-number predictor.

## Strategies

Implement and test these strategy types:

- `balance`
- `frequent`
- `overdue`
- `high_payout`
- `random`
- `sougaku_delete`
- `mixed`

## Deletion Numbers

- Treat deletion numbers as scores by default:
  - deletionCandidateScore
  - adoption suppression score
  - sougakuDeletionScore
  - sougakuPartitionScore
- Provide modes: none, weak, strong, hard.
- Only `hard` may fully exclude, and it must be user-selected or backtest-specific.

## Backtests

- Use walk-forward:
  - Train on draws up to N.
  - Predict N+1.
  - Then advance by one draw.
- Never compute features for a past prediction from full-period data.
- Compare against random.
- Report average matches, 3+ match rate, prize hits, payout, payout per ticket, drawdown, period stability, and overfitting risk.

## Scoring

- Use configurable weights in `src/config/strategyWeights.ts`.
- Do not display scores as absolute winning probabilities.
- Prefer deterministic seeded randomness in tests and reports.

