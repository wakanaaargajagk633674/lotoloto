# Design System

## Theme

Dark UI, designed as a data-analysis dashboard.

CSS variables:

- Background: `#070A12`
- Surface: `#0D1220`
- Surface 2: `#121A2C`
- Border: `rgba(255,255,255,0.08)`
- Text Primary: `#F8FAFC`
- Text Secondary: `#94A3B8`
- Accent Cyan: `#22D3EE`
- Accent Emerald: `#34D399`
- Accent Violet: `#A78BFA`
- Accent Gold: `#FBBF24`
- Warning: `#F97316`

## Layout

- Max width: around 1200px.
- Desktop: 2-column workspace, 2-column ticket grid, 4-column insight grid.
- Mobile: single column.
- Use card surfaces with 8px radius.
- Keep information dense but separated by clear panels.

## Number Balls

Number balls communicate state.

- Standard: deep graphite gradient
- Trend: cyan
- Gap: violet
- High-return: gold
- Candidate tuning: thin emerald ring

Tap/click opens the number reason panel.

## Scores

- Total score: conic CSS ring
- Supporting scores: animated bars
- Tags: compact rounded badges
- Scores are relative strategy indicators, not winning probabilities.

## Motion

Use quiet motion only:

- Card fade-in
- Number ball entrance
- Score bar growth
- Hover lift

Do not use flashing, jackpot-style animation, or urgency effects.

## Accessibility

- Keep contrast high on dark surfaces.
- Buttons have visible labels.
- Mobile controls stack vertically.
- Safety notices are visible and readable, not hidden in tiny footnotes.

