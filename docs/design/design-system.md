# Design System

## Theme

Light, fresh, and friendly UI. The product should feel closer to a public service, household budgeting app, or simple data summary than a gambling prediction site.

## Palette

CSS variables:

- Background: `#F7FBFF`
- Background soft: `#EEF6FF`
- Surface: `#FFFFFF`
- Surface soft: `#F8FAFC`
- Border: `#E2E8F0`
- Text Primary: `#0F172A`
- Text Secondary: `#475569`
- Text Muted: `#64748B`
- Primary Blue: `#2563EB`
- Sky Blue: `#0EA5E9`
- Teal: `#14B8A6`
- Green: `#22C55E`
- Gold: `#F59E0B`
- Warning: `#F97316`
- Danger: `#DC2626`

Color intent:

- Blue: trust, data, clean navigation
- Sky blue: freshness
- Green: reassurance and balance
- Gold: gentle emphasis
- Red: only error or strong caution

## Layout

- Max width: around 1180px.
- Top order: hero, simple settings, tickets, reasons, data details, notice, backtest.
- Desktop: 2-column hero, 2-column ticket grid.
- Mobile: single column.
- Cards use 14px radius, light borders, and soft shadows.
- Advanced analysis is placed inside details sections, not shown before the user sees tickets.

## Number Balls

Number balls are friendly and clear.

- Standard: white background with pale blue border
- Trend: pale green
- Gap: pale violet
- Distribution-risk mode: pale gold
- Candidate adjustment: thin teal outline

Each number can include a short reason label such as:

- 出現多め
- 間隔参考
- 32以上
- バランス

## Metrics

All metrics must use `MetricWithLabel`.

Required:

- label
- value
- unit where applicable
- help text

Forbidden:

- number plus unexplained parentheses
- raw internal score labels without explanation
- raw interval labels without explanation
- unexplained ranking values

## Motion

Use quiet motion only:

- Card fade-in
- Number ball entrance
- Score bar growth
- Subtle hover lift

Do not use flashing, jackpot-style animation, neon glow, or urgency effects.

## Accessibility

- High contrast on white and pale blue surfaces.
- Buttons have visible labels.
- Mobile layout stacks vertically.
- Safety notices are visible, readable, and not hidden in tiny footnotes.
- Help text is available for metrics.
