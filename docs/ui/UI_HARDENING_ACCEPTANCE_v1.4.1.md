# UI Hardening Acceptance v1.4.1

Date: 2026-03-19
Branch: `release-readiness/v1.4.1-hardening`
Scope: post-`v1.4.0` stability hardening only (no feature expansion)

## P0 Hardening Completed

1. Decode truthfulness
- Decode completion status now reflects real result outcome:
  - success only when viable candidates/best exist
  - warn when review is required or no viable candidates are selected
  - bad when no extractable result is produced

2. State desync prevention
- New decode runs now clear prior result state before processing.
- Trust seal enters explicit pending state while decode is in flight.
- Failed decode paths clear stale result state and mark trust seal unavailable.

3. Trust/proof seal integrity signal
- Removed random seal generation.
- Seal hash now derives deterministically from the decode result payload.
- Async seal updates are guarded against out-of-order updates.

4. Export flow hardening
- Case export filename now uses `case_id` (not `id`) for traceable artifact names.
- Export bridge availability is validated before export calls.
- Notes export and case export now provide explicit failure/cancel handling.

5. UI proof-gate strengthening
- `verify:ui` now enforces:
  - no random hash usage
  - decode outcome evaluation path present
  - deterministic seal update function present
  - export filename path keyed to `case_id`
  - explicit export failure messaging strings

## Verification Results

Executed on this branch after P0 fixes:

- `npm test` PASS
- `npm run verify:ui` PASS
- `npm run verify` PASS (after build output exists)
- `npm run build:wrapper` PASS

## Intentional Deferrals (P1/P2)

- additional visual polish and non-essential layout experimentation
- broader typography/spacing refinements beyond hardening scope
- feature-surface expansion (reserved for `feat/v1.5.0-expansion`)
