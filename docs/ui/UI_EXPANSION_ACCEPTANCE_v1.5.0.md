# UI Expansion Acceptance v1.5.0

Date: 2026-03-19
Branch: `feat/v1.5.0-expansion`
Execution anchor: `docs/release/V1_5_0_EXECUTION_PLAN.md`

## Scope for First Acceptance Pass

This acceptance document is for Slice 1 only:
- batch decode + case/workspace flow
- trust/evidence readability within that flow
- export/report usefulness tied to the same flow

This is not a generic UI polish checklist.

## Acceptance Scenarios (Operator-Critical)

1. Batch decode truthfulness
- Given a mixed batch (success + warn + fail), queue rows must show truthful per-item state.
- Global status must not show unconditional success when warnings/failures exist.
- Completion summary must include counts that match actual outcomes.

2. Decode to case/workspace continuity
- After decode completion, operator can open the related case without state loss.
- Active case ID remains consistent across queue, case list, and workspace panels.
- New decode run clears stale output indicators from prior run.

3. Trust/evidence state readability
- Trust panel states are explicit for empty/loading/success/warn/error.
- Evidence/timeline surfaces remain readable while queue updates are in progress.
- No stale trust proof indicators remain after decode error/failure paths.

4. Export/report action clarity
- Case export shows explicit success path with output location.
- Export/report blocked or canceled states show explicit reason text.
- Failures do not silently succeed and do not leave ambiguous status text.

5. Keyboard and focus integrity in new flow controls
- Queue and case actions are reachable by keyboard in logical order.
- Focus visibility remains present on all new actionable controls.
- Live status region announces decode/export outcomes without misleading wording.

## Required `verify:ui` Additions (Slice 1)

- Assert presence of queue state label hooks for batch lifecycle states.
- Assert decode outcome evaluation path still controls operator status messaging.
- Assert trust/evidence state strings for empty/loading/success/warn/error hooks.
- Assert explicit export/report failure messaging hooks remain present.
- Assert no regression to random/non-deterministic proof indicators.

## Regression Guardrails

- No regression in existing hardening checks from `v1.4.1`.
- No reintroduction of stale-state carryover across consecutive decode runs.
- No export filename/path regressions away from `case_id` anchored behavior.

## Manual Validation Checklist

- Run one single-item decode and one multi-item decode from the same session.
- Confirm queue and status messaging match observed outcomes.
- Open resulting case and verify workspace context remains coherent.
- Trigger one export success and one forced export failure path.
- Confirm trust/evidence surfaces stay readable through each transition.

## Automated Gate Requirement After First Real Code Slice

```bash
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
```

Add:

```bash
npm run audit:final
```

when proof or release-path logic is touched.

## Non-Goals

- Theme-only updates without workflow value.
- Additional panels that do not improve operator decision flow.
- Cosmetic animation work unrelated to acceptance scenarios.
