# Algorithm Rules

## Positioning

The app is an explainable reference-ticket generator, not a winning-number predictor.

## Strategies

Implement and test these strategy types:

- `balance`
- `hot_trend`
- `deep_gap`
- `high_return`
- `pure_random`
- `pattern_filter`
- `smart_mix`

## Pattern Filter

- Treat source-inspired pattern logic as candidate-priority signals by default:
  - candidateAdjustmentScore
  - sourcePatternSignalScore
  - sourcePatternBalanceScore
  - lowPrioritySignalScore
- Provide modes: off, light, focused, strict.
- `strict` may remove low-priority candidates only when user-selected or used for backtest comparison.

## Backtests

- Use walk-forward:
  - Train on draws up to N.
  - Predict N+1.
  - Then advance by one draw.
- Never compute features for a past prediction from full-period data.
- Compare against pure_random.
- Report average matches, 3+ match rate, prize hits, payout, payout per ticket, drawdown, period stability, and overfitting risk.

## Scoring

- Use configurable weights in `src/config/strategyWeights.ts`.
- Do not display scores as absolute winning probabilities.
- Prefer deterministic seeded randomness in tests and reports.
