# Loto Method Research 2026-06-27

## Safety Position

- Loto6 and Loto7 are random-number lottery products. Past results and public anecdotes do not create a reliable prediction edge.
- This research is used only to improve portfolio construction, explanation quality, and validation discipline.
- No method below should be described as increasing true draw probability or guaranteeing a win.

## Official And Primary Sources

1. Mizuho Bank: Loto rules
   - URL: `https://www.mizuhobank.co.jp/tenpoinfo/atm/takarakuji/t01.html`
   - Signals:
     - Loto7 selects 7 distinct numbers from 1-37.
     - Loto6 selects 6 distinct numbers from 1-43.
     - Quick Pick is an official purchase option.
     - Carryover changes payout ceiling, not hit probability.
2. Rakuten Bank: Loto6 odds and purchase methods
   - URL: `https://www.rakuten-bank.co.jp/takarakuji/loto6/`
   - Signals:
     - Loto6 1st prize probability is `1/6,096,454`.
     - Lower-tier probabilities are explicitly combinatorial.
     - Random / Quick Pick / auto purchase options are common official purchase patterns.
3. Rakuten Bank: Loto7 odds and purchase methods
   - URL: `https://www.rakuten-bank.co.jp/takarakuji/loto7/`
   - Signals:
     - Loto7 1st prize probability is `1/10,295,472`.
     - Loto7 lower-tier probabilities are also combinatorial.
4. Rakuten Lottery analysis UI
   - URL: `https://takarakuji.rakuten.co.jp/data/loto/loto7/most_numbers/`
   - Signal:
     - Public lottery UX already exposes recent/all-time frequency rankings and lets users combine selected numbers with computer-generated remaining numbers.

## X Signals

Hermes `x_search` was used. X posts are treated only as weak public signals, not verified facts.

### Query: `ロト7 当選 買い方 クイックピック 継続`

- `https://x.com/zidaraku_com/status/2070079072810746176`
  - Signal: user reported buying multiple Quick Pick Loto7 tickets and seeing the same numbers repeated.
  - Engineering interpretation: multi-ticket generation should explicitly avoid exact duplicates and excessive pair reuse.
- `https://x.com/chono_cksh/status/2070641020602368441`
  - Signal: user reported usually using fixed numbers but winning a lower prize after adding a Quick Pick ticket.
  - Engineering interpretation: random / semi-random mixing is a reasonable portfolio component.
- `https://x.com/Raptor_koba/status/2069371478165061962`
  - Signal: user discussed carryover-triggered automatic purchase and a small positive result.
  - Engineering interpretation: carryover is a payout-context signal, not a hit-probability signal.

### Query: `ロト6 高額当選 番号 選び方`

- `https://x.com/takaradashiki/status/2005399484701032811`
  - Signal: high-sum / high-number Loto6 method circulated with high engagement.
  - Engineering interpretation: use only as a soft high-return / popularity-avoidance signal.
- `https://x.com/takaradashiki/status/1997238082169352475`
  - Signal: low-mid-high band balancing method circulated with high engagement.
  - Engineering interpretation: existing combination balance logic is directionally aligned.
- `https://x.com/takaradashiki/status/2002737770284908814`
  - Signal: pair-frequency method circulated as a way to pick partner numbers.
  - Engineering interpretation: pair frequency can be used as a tiny soft signal, but not a hard filter.
- `https://x.com/neo9723/status/2070101166986514530`
  - Signal: statistics/AI-style prediction accounts discuss sum ranges, high zones, and odd/even splits.
  - Engineering interpretation: keep these as explanation themes and backtest them; do not market them as predictive.

### Failed X Query

- Query: `ロト6 当選 買い方 クイックピック 継続`
- Result: `429 Too Many Requests`
- Fallback: no retry loop beyond the successful related X queries. Treat X coverage as short-run signal collection only.

## Research Takeaways

- Official sources support random/Quick Pick and frequency-analysis UX, but they do not claim prediction.
- Public winning anecdotes and X posts cluster around:
  - Quick Pick / random additions
  - fixed-number continuation
  - carryover-triggered buying
  - low-mid-high band balance
  - high-sum or high-number contrarian selections
  - pair/co-occurrence folklore
- Product implementation should:
  - avoid duplicate tickets in multi-ticket output
  - reduce repeated pairs across a portfolio
  - keep random control strategies visible
  - treat high-return as payout-sharing context, not higher hit probability
  - show validation results without implying future success
