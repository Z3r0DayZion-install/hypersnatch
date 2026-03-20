# UI Runtime Proof Plan v1.5.5

Date: 2026-03-20  
Branch: `release-readiness/v1.5.5-hardening`

## Goal

Push `verify:ui` further from source-structure validation toward interaction-level runtime proof for operator-critical flows.

## Priority Runtime Truth Surfaces

1. Queue transition interactions (`queued`, `running`, `paused`, `manual-review`, `warning`, `failed`, `canceled`, `completed`).
2. Manual-review transition semantics and reason persistence.
3. Reopen flows and blocked reopen behavior where applicable.
4. Case/report integrity under linked-job and state transitions.
5. Export blocked/failure truth and readiness semantics.
6. Lineage/timeline runtime order, severity, and reason-chain behavior.

## Approach

1. Keep existing static + helper-runtime assertions in `scripts/ui_smoke_check.js`.
2. Add deeper interaction-focused runtime checks for high-risk operator transitions.
3. Prefer deterministic state simulation checks over broad visual checks.
4. Keep scope proof-focused; no UI redesign.

## Exit Criteria

1. `verify:ui` fails on interaction-level transition drift in critical flows.
2. Queue/manual-review/reopen/report/export/lineage runtime behavior has stronger proof coverage.
3. Full hardening gate order remains green.
