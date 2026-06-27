# Decision Log 2026-06-27 Logic Validation

## D1: Improve portfolio construction, not prediction claims

- Decision: Add multi-ticket spread controls for duplicate numbers, duplicate pairs, and repeated range profiles.
- Reason: The user's actual purchase pattern uses many tickets. Reducing portfolio duplication is actionable and safety-compatible.
- Non-goal: Do not claim higher true draw probability.

## D2: Adopt Loto6-only soft portfolio tuning

- Decision: Apply pair-frequency, high-sum, and portfolio-spread bonuses only to Loto6 candidate scoring.
- Reason: Three-loop validation improved Loto6 smart_mix low-tier hit count from `37` baseline to `57` in the full walk-forward smart_mix comparison.
- Caveat: Average main matches fell from `0.8379` to `0.8164`, so the change is a portfolio tradeoff rather than a strict statistical win.

## D3: Reject Loto7 predictive additions

- Decision: Revert Loto7 to baseline-style candidate scoring.
- Reason: Loops 1 and 2 degraded Loto7 smart_mix prize hits and payout metrics. The final loop matched baseline after disabling Loto7-specific additions.
- Product implication: For Loto7, keep random and high-return controls visible, but do not add extra predictive logic from weak signals.

## D4: Treat X and winner anecdotes as weak signals only

- Decision: X and web anecdotes may influence soft validation hypotheses, never hard filters or guarantee language.
- Reason: Public posts and winner stories are anecdotal, selectively visible, and not causal evidence.
