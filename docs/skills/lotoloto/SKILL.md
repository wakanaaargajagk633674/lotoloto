---
name: lotoloto
description: Work on the Lotoloto app for Japanese Loto6/Loto7 data analysis, explainable reference ticket generation, sougaku-inspired deletion-number hypotheses, walk-forward backtesting, and safety-conscious Next.js/Vercel implementation. Use when modifying this repository, lottery data pipelines, prediction strategy code, backtest reports, or UX copy for responsible lottery use.
---

# Lotoloto Skill

Use this skill when working inside the Lotoloto repository.

## Required Workflow

1. Check `git status --short --branch` before edits.
2. Read the relevant rule files:
   - `DATA_RULES.md` for download, parsing, and storage.
   - `ALGORITHM_RULES.md` for features, scoring, generation, and backtests.
   - `UX_SAFETY_RULES.md` for user-facing wording.
3. Treat every strategy as a reference theme, not a probability guarantee.
4. Keep sougaku-derived ideas as hypotheses until walk-forward backtests support or reject them.
5. Update `docs/history/`, `docs/decisions/`, and `docs/reviews/` for meaningful changes.
6. Run focused tests, then `npm test`, `npm run typecheck`, and `npm run build` when implementation changes.

## Non-Negotiables

- Do not claim improved odds, guaranteed hits, or certain deletion numbers.
- Do not use future draws in feature generation or backtests.
- Do not hard-exclude deletion numbers by default.
- Do not ask the user to run commands; execute required commands directly.

