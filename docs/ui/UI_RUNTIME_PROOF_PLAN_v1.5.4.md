# UI Runtime Proof Plan v1.5.4

Date: 2026-03-20  
Branch: `release-readiness/v1.5.4-hardening`

## Goal

Deepen `verify:ui` from mostly static semantic checks to stronger runtime-oriented contract checks.

## Priority Runtime Truth Surfaces

1. Queue transition semantics (`queued`, `running`, `paused`, `manual-review`, `warning`, `failed`, `canceled`, `completed`).
2. Manual-review reason visibility and control-state behavior.
3. Reopenability rules for completed/warning/failed/canceled jobs.
4. Case/report integrity under linked-job and state transitions.
5. Export blocked/failure vs ready-state truth.
6. Lineage/timeline ordering, severity, and reason-chain behavior.

## Approach

1. Keep existing static contract assertions in `scripts/ui_smoke_check.js`.
2. Add runtime-evaluated checks for selected pure UI state helpers.
3. Validate sample state transitions via executable assertions, not only regex structure checks.
4. Keep scope narrow to proof hardening; no UI redesign.

## Exit Criteria

1. `verify:ui` fails if key runtime state semantics drift while hooks remain present.
2. Queue/manual-review/reopen/export/timeline behavior has executable proof coverage.
3. Full hardening gate order remains green.
