# Previous Overlap Scoring Decision

Date: 2026-06-30 JST

## Decision

Add previous-draw main-number overlap to ticket generation as a soft combination-level score, not as a direct number-level boost.

## Rationale

- Historical Loto6 and Loto7 overlap rates are close to theoretical random-combination rates.
- The signal is useful for avoiding unusually extreme combinations, but not for claiming a better chance of winning.
- Existing code already exposed `previousDrawOverlap`; this change makes it actionable and visible without changing the core random nature of loto draws.

## Scoring Policy

- Use empirical overlap distribution from the available training history.
- Fall back to theoretical combination rates only when there is not enough history.
- Apply strategy-specific weight from `src/config/strategyWeights.ts`.
- Keep `pure_random` least affected.
- Avoid hard exclusions by default.

## Safety Copy

UI copy must frame the metric as "past-pattern reference" or "extreme-check" only. It must not state or imply that a repeated previous number is more likely to be drawn.
