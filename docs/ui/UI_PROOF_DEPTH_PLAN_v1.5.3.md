# UI Proof Depth Plan v1.5.3

Date: 2026-03-20  
Branch: `release-readiness/v1.5.3-hardening`

## Goal

Deepen `verify:ui` from static hook-presence checks toward runtime-transition truth for operator-critical flows.

## Priority Runtime Truth Surfaces

1. Queue state transitions (`queued`, `running`, `paused`, `manual-review`, `warning`, `failed`, `canceled`, `completed`).
2. Manual-review transitions and reason-chain rendering.
3. Reopen flows from completed/warning/failed/canceled states.
4. Case/report state integrity across empty/loading/error/ready states.
5. Export blocked/failure truth messaging and availability semantics.
6. Lineage/timeline severity truth and ordering under runtime updates.

## Approach

1. Strengthen `scripts/ui_smoke_check.js` with tighter transition-contract assertions where practical.
2. Add focused runtime-oriented UI checks for high-risk flows rather than broad visual assertions.
3. Keep scope constrained to trust/proof behavior; no UI redesign.

## Exit Criteria

1. `verify:ui` catches regressions in queue/manual-review/reopen/report/export/lineage transition truth.
2. Assertions are tied to operator-facing state semantics, not decorative markup.
3. Full hardening gate order remains green after proof-depth changes.