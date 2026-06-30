# Previous Number Label Decision

Date: 2026-06-30 JST

## Decision

When a generated ticket number was included in the previous draw's main numbers, show `（前回出現数字）` in the existing number-label position.

## Rationale

- Users asked to see the previous-draw carryover context directly under each candidate number.
- The existing label slot already shows short reasons such as `出現多め`, so using the same location keeps the UI compact.
- The label is informational and should not imply improved winning probability.

## UI Rule

- Previous main-number appearance takes priority over the other compact reason labels.
- Previous bonus-only appearance is not labeled by this change.
