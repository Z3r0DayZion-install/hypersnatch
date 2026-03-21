# UI Packaged Proof Plan v1.5.8

Date: 2026-03-21  
Branch: `release-readiness/v1.5.8-hardening`

## Goal

Increase confidence that operator-critical workflow truth remains correct under runtime state changes, not only static structure checks.

## Target Flows

1. Queue action flows:
   - pause/resume/manual-review/cancel/requeue success and failure semantics
   - reason-chain defaults and status messaging
2. Manual-review flows:
   - deterministic reason handling
   - trust/risk rollup consistency after state transitions
3. Reopen flows:
   - case-workspace reopenability guards
   - reopen action reason text and sync behavior
4. Export blocked/failure truth:
   - blocked/no-active-case behavior
   - failed action behavior and explicit operator messaging
5. Report/lineage behavior:
   - case report generation/export from active context
   - timeline/lineage content integrity under state changes

## Verification Strategy

1. Extend `scripts/ui_smoke_check.js` with deeper runtime interaction assertions.
2. Prefer executable assertions over prose assumptions.
3. Keep checks deterministic and offline.
4. Avoid product-surface behavior changes unless needed to align runtime truth.

## Acceptance

1. `npm run verify:ui` fails on meaningful interaction-state regressions in targeted flows.
2. Full required gate order remains green after proof-depth changes.
