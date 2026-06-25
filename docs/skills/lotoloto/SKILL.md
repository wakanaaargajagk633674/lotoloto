---
name: lotoloto
description: Work on the Lotoloto app for Japanese Loto6/Loto7 data analysis, explainable reference ticket generation, source-inspired pattern-filter hypotheses, walk-forward backtesting, and safety-conscious Next.js/Vercel UX. Use when modifying this repository, lottery data pipelines, prediction strategy code, backtest reports, design docs, or responsible lottery UX copy.
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
4. Keep source-inspired pattern logic as a hypothesis until walk-forward backtests support or reject it.
5. Update `docs/history/`, `docs/decisions/`, and `docs/reviews/` for meaningful changes.
6. Run focused tests, then `npm test`, `npm run typecheck`, and `npm run build` when implementation changes.

## Non-Negotiables

- Do not claim improved odds, guaranteed hits, or certain winning candidates.
- Do not use future draws in feature generation or backtests.
- Do not make strict filtering the default.
- Do not ask the user to run commands; execute required commands directly.
