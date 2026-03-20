# UI Runtime Proof Plan v1.5.6

Date: 2026-03-20  
Branch: `release-readiness/v1.5.6-hardening`

## Goal

Push `verify:ui` from helper/runtime assertions toward deeper interaction-level state proof on operator-critical flows.

## Priority Runtime Surfaces

1. Queue transitions and action semantics.
2. Manual-review transitions and reason-chain persistence.
3. Reopen flow behavior by status.
4. Case/report integrity under state changes.
5. Export blocked/failure truth.
6. Lineage/timeline ordering and severity truth.

## Approach

1. Keep existing static and helper-runtime checks.
2. Add deeper runtime behavior assertions on transition intent and state semantics.
3. Keep scope proof-focused; no UI redesign.

## Exit Criteria

1. Critical state transitions are harder to fake-pass.
2. Manual-review/warning/failure/export-blocked semantics are more directly asserted.
3. Full hardening gate order remains green.
