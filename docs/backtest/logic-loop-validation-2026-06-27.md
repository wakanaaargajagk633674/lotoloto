# Logic Loop Validation 2026-06-27

## Scope

- Request: run roughly three validation loops after a weak real purchase outcome.
- Purchase context to consider: Loto6 `20` tickets, Loto7 `10` tickets.
- Validation rule: walk-forward only. No target draw uses future data.

## Loop Summary

| game | loop | smart_mix avg main matches | smart_mix prize hits | smart_mix match3+ rate | avg payout/ticket | judgment |
|---|---|---:|---:|---:|---:|---|
| loto6 | baseline | 0.8379 | 37 | 2.04% | 51.0 | starting point |
| loto6 | loop1 portfolio spread | 0.8379 | 40 | 2.21% | 47.5 | small hit-count improvement |
| loto6 | loop2 randomized smart mix | 0.8181 | 51 | 2.81% | 42.7 | more low-tier hits, lower average matches |
| loto6 | loop3 game-aware mix | 0.8164 | 57 | 3.14% | 44.0 | adopted for Loto6 smart_mix behavior |
| loto7 | baseline | 1.4032 | 29 | 13.68% | 89.5 | starting point |
| loto7 | loop1 portfolio spread | 1.3961 | 26 | 13.85% | 81.9 | not enough improvement |
| loto7 | loop2 randomized smart mix | 1.3819 | 21 | 12.97% | 46.2 | rejected |
| loto7 | loop3 game-aware mix | 1.4032 | 29 | 13.68% | 89.5 | reverted to baseline scoring for Loto7 |

## Portfolio Validation

Short recent-window validation used the actual purchase scale:

- Loto6: 20 tickets per draw, latest 120 target draws
- Loto7: 10 tickets per draw, latest 120 target draws

| game | profile | tickets | prize hits | ticket hit rate | at least one hit/draw | avg main matches | max main matches | payout/spend |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| loto6 | smart_mix_recommended | 2400 | 62 | 2.58% | 43.33% | 0.836 | 5 | 82.5% |
| loto6 | pure_random_control | 2400 | 72 | 3.00% | 49.17% | 0.845 | 4 | 21.4% |
| loto6 | high_return_control | 2400 | 80 | 3.33% | 51.67% | 0.833 | 4 | 22.0% |
| loto7 | smart_mix_recommended | 1200 | 37 | 3.08% | 23.33% | 1.312 | 5 | 12.7% |
| loto7 | pure_random_control | 1200 | 46 | 3.83% | 33.33% | 1.357 | 4 | 14.1% |
| loto7 | high_return_control | 1200 | 40 | 3.33% | 28.33% | 1.341 | 5 | 13.9% |

## Adopted Changes

- Loto6 smart_mix now uses a game-aware mix with more random/high-return spread.
- Multi-ticket generation now tracks number reuse, pair reuse, and range-profile reuse.
- Pair-frequency and high-sum signals are tiny soft signals for Loto6 only.
- Loto7 predictive additions were rejected after validation and reverted to baseline-style scoring.
- Test coverage now asserts that a 20-ticket generated portfolio does not contain exact duplicate tickets.

## Non-Adopted Ideas

- Hard excluding numbers from X or web anecdotes.
- Claiming frequency or pair methods increase true probability.
- Increasing purchase amount as a recommendation.
- Applying Loto6 portfolio tuning blindly to Loto7.

## Interpretation

- Loto6 loop3 improves smart_mix low-tier historical hit count versus baseline, but lowers average matches and does not improve expected probability in a mathematical sense.
- Loto7 showed no robust improvement from extra logic. The safer result is to keep Loto7 closer to random/baseline behavior.
- Portfolio validation showed pure random controls remain strong. This is consistent with lottery randomness and should remain visible in UI/strategy choices.
