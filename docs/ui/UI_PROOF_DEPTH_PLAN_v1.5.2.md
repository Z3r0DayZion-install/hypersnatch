# UI Proof Depth Plan v1.5.2

Date: 2026-03-20  
Branch: `release-readiness/v1.5.2-hardening`

## Goal

Increase confidence that UI truth signals still hold under critical operator-state transitions.

## Priority Assertions

1. Queue transition semantics remain explicit (`queued`, `running`, `paused`, `manual-review`, `warning`, `failed`, `canceled`, `completed`).
2. Manual-review and warning/failure states remain visually and semantically distinct.
3. Reopenability contracts remain enforced for finished/error states.
4. Case/report/export blocked-state truth remains explicit.
5. Lineage/timeline rendering hooks remain deterministic and complete.

## Approach

1. Strengthen `scripts/ui_smoke_check.js` for high-risk state-truth contracts.
2. Avoid redesign or feature additions.
3. Keep all assertions tied to operator truth, not decorative UI.

## Exit Criteria

1. `verify:ui` catches regressions in core state-truth semantics.
2. Full stable-order gates remain green after assertion tightening.

