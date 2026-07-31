# Prediction Logic Redesign Decisions

Date: 2026-07-31

## Decisions

1. Redefine the optimization objective. Hit probability is fixed by the draw and cannot be improved by number
   selection, so the algorithm optimizes two separate things: not degrading hit probability, and lowering the
   expected number of other holders of the same combination under the pari-mutuel prize split.
2. Replace the hard-coded "1-31 is popular" rule with an estimated popularity model. A prior over buyer behaviour
   is blended with an empirical estimate derived from the lowest main-number prize tier's winner counts,
   normalized by tickets sold and standardized per draw, using n/(n+200) shrinkage.
3. Include Japanese market number preferences (7, 8, 3 favoured; 4, 9 avoided; consecutive runs avoided) in the
   prior. These are treated strictly as predictions of other buyers' behaviour, never as predictions of the draw.
4. Remove the top `mainCount x 4` candidate pool restriction. It leaves expected matches unchanged while raising
   variance with no compensating benefit.
5. Cap evidence-light signals (recent, long, gap, prev, bonus, candidate_tuning, pattern_filter) at a combined
   weight of 0.62 and add `neutral_blend` to pull number scores back toward the uniform average. Keep the
   strategies themselves so users retain a choice of selection style.
6. Require at least two numbers at or below 31 in every ticket. Pure popularity avoidance collapses into an
   all-above-31 ticket, which is a widely used system pick and an extrapolation beyond what the data supports.
7. Add `averageCombinationPopularityIndex` and `selectionEntropyGap` to the backtest summary so the popularity
   objective is measurable rather than assumed.
8. Compute the popularity model only from draws available before each target draw, and memoize by history length.

## Rationale

- The walk-forward record through draw 2124 showed pure_random matching or beating every analytical strategy,
  which is what an unbiased draw predicts. Narrowing the candidate pool was adding variance without any edge.
- The prize split is the only part of the payout the buyer can influence, so it is the only defensible target.
- Estimating popularity from observed winner counts replaces a guess with a measurement, and shrinkage makes the
  prior fade automatically wherever the data disagrees with it.
- Budgeting the evidence-light signals keeps the implementation consistent with the displayed wording that these
  strategies express a selection preference and do not improve the chance of winning.
- Payout differences between strategies in the backtest are dominated by rare tier 1-3 hits and are not treated
  as evidence for or against the change.

## Not Changed

- The expected value of a ticket remains below its price. The redesign does not claim otherwise and the wording
  in the UI and reports states this explicitly.
- Pattern signals remain soft priority adjustments and never exclude numbers.
