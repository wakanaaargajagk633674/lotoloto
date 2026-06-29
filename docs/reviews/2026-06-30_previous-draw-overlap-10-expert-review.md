# Previous Draw Overlap 10 Expert Review

Date: 2026-06-30 JST

## Scope

Discuss whether "numbers carried over from the previous winning main numbers" should be added to ticket evaluation. This is a design review only. No implementation was made.

## Observed Statistics

Source data:

- Loto6: `data/processed/loto6_draws.json`, 2,115 draws, 2,114 transitions
- Loto7: `data/processed/loto7_draws.json`, 683 draws, 682 transitions

### Loto6 Previous Main Number Overlap

Theoretical random distribution:

- 0 overlap: 38.13%
- 1 overlap: 42.90%
- 2 overlaps: 16.25%
- 3 overlaps: 2.55%
- 4 overlaps: 0.16%

Observed all-history distribution:

- 0 overlap: 770 times, 36.42%
- 1 overlap: 968 times, 45.79%
- 2 overlaps: 332 times, 15.70%
- 3 overlaps: 39 times, 1.84%
- 4 overlaps: 5 times, 0.24%
- Average overlap: 0.837
- At least 1 overlap: 63.58%
- At least 2 overlaps: 17.79%
- Previous bonus became a main number: 13.53%

Recent 100 transitions:

- 0 overlap: 36
- 1 overlap: 52
- 2 overlaps: 10
- 3 overlaps: 2
- Average overlap: 0.780
- At least 1 overlap: 64.00%

### Loto7 Previous Main Number Overlap

Theoretical random distribution:

- 0 overlap: 19.77%
- 1 overlap: 40.37%
- 2 overlaps: 29.07%
- 3 overlaps: 9.32%
- 4 overlaps: 1.38%
- 5 overlaps: 0.09%

Observed all-history distribution:

- 0 overlap: 127 times, 18.62%
- 1 overlap: 287 times, 42.08%
- 2 overlaps: 187 times, 27.42%
- 3 overlaps: 70 times, 10.26%
- 4 overlaps: 11 times, 1.61%
- Average overlap: 1.342
- At least 1 overlap: 81.38%
- At least 2 overlaps: 39.30%
- Previous bonus became a main number: 35.48%

Recent 100 transitions:

- 0 overlap: 15
- 1 overlap: 40
- 2 overlaps: 30
- 3 overlaps: 11
- 4 overlaps: 4
- Average overlap: 1.490
- At least 1 overlap: 85.00%

## 10 Expert Discussion

1. Statistician: The observed rates are close to the random-combination theoretical values. This feature should not be treated as predictive evidence that a specific previous number is more likely to appear again.
2. Lottery domain reviewer: Excluding all previous winning numbers is not supported. Loto6 has at least one repeat in roughly 64% of transitions, and Loto7 in roughly 81%.
3. Data scientist: The useful signal is distribution alignment, not direction. Score candidate tickets by whether their previous-draw overlap is in a historically common range.
4. Backtest engineer: Any change must be tested walk-forward. A simple filter may overfit because the empirical distribution mostly follows mathematical expectation.
5. Product safety reviewer: UI wording must avoid suggesting that previous numbers increase winning probability. Use language such as "過去の出方との近さ" or "極端さの確認".
6. UX reviewer: The concept is easy for users to understand if shown as "前回本数字との重なり: 1個" with a neutral explanation. Avoid red/green pass-fail language.
7. Scoring engineer: Existing code already has a light `prev` score and `previousDrawOverlap` combination metric. A future change should consolidate these instead of adding another independent penalty.
8. High-return strategy reviewer: Repeating previous winning numbers may affect popularity behavior, but evidence is not strong enough to use as a high-return boost without separate purchase-popularity data.
9. QA reviewer: Edge cases should be constrained. For Loto6, 4+ overlaps is extremely rare; for Loto7, 5+ overlaps is extremely rare. These should be warnings, not hard exclusions.
10. Release reviewer: The feature is appropriate for a future design pass as an explainable soft signal. It should not block current data refresh work.

## Recommendation

Add this later as a soft, combination-level distribution check, not as a direct number-level prediction boost.

Suggested default target ranges:

- Loto6: normal range 0 to 2 overlaps, preferred center 1 overlap, caution at 3+, strong caution at 4+.
- Loto7: normal range 1 to 2 overlaps, acceptable 0 or 3 overlaps, caution at 4+, strong caution at 5+.

Suggested scoring behavior:

- Keep no hard filter by default.
- Penalize extreme overlap counts softly.
- Do not reward a specific previous winning number just because it appeared in the previous draw.
- Treat previous bonus-to-main overlap as a secondary explanatory statistic, not a primary score.

Future validation requirement:

- Run walk-forward backtests comparing baseline, overlap soft scoring, and overlap hard filtering.
- Report average match count, prize-hit count, payout proxy, and distribution drift.
- Keep product copy clear that this is a historical-pattern reference and not a prediction guarantee.

## Implementation Follow-Up

Implemented after review as a soft signal only:

- Added previous-overlap rate, score, and band to combination scoring.
- Added a small strategy-managed weight in `src/config/strategyWeights.ts`.
- Added ticket card display for overlap count and historical rate.
- Added test coverage to ensure common overlap patterns score above extreme overlap patterns.
- No hard filter was added.
