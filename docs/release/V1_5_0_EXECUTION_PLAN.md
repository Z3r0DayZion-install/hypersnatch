# v1.5.0 Execution Plan

Date: 2026-03-19
Branch: `feat/v1.5.0-expansion`
Scope anchor: `docs/release/V1_5_0_SCOPE.md`
UI anchor: `docs/ui/UI_EXPANSION_GOALS_v1.5.0.md`
Baseline stable: `v1.4.1` (`205ecdaa49d7a64039793bbabbb3d4645502f770`)

## Execution Rule

`v1.5.0` starts with one real implemented slice.
No speculative redesign, no release chores, no version bump during this slice.

## Slice 1 (First Implementation)

Name: Batch decode + case/workspace flow

Outcome target:
- Operators can run multi-item decode work with truthful queue state.
- Operators can move from decode results into case workspace without stale or ambiguous state.
- Trust/evidence panel readability supports decision-making during active workflow.
- Export/report output is usable from the same flow and fails explicitly when blocked.

## Slice 1 Workstreams

1. Batch decode orchestration
- Harden queue state labels and transitions (queued/running/paused/complete/warn/failed/canceled).
- Ensure queue transitions match actual decode outcomes.
- Remove stale-success risk when batch has partial failures.

Candidate code surfaces:
- `ui/hypersnatch-ui.html`
- `src/automation/decodeQueue.js`
- `src/automation/decodeScheduler.js`
- `src/main.js` (queue IPC and state exposure)

2. Case/workspace flow integrity
- Ensure decode results route cleanly into case context (`case_id` anchored).
- Preserve operator context when moving between queue, case list, and active case views.
- Prevent stale carryover across consecutive decode and case operations.

Candidate code surfaces:
- `ui/hypersnatch-ui.html`
- `src/main.js` case IPC handlers
- `src/cases/*`
- `src/workspaces/*`

3. Trust and evidence readability
- Improve status clarity in trust/proof panel for empty/loading/success/warn/error states.
- Keep trust context readable while queue and case data updates occur.
- Ensure evidence/timeline state remains operator-readable during active decode cycles.

Candidate code surfaces:
- `ui/hypersnatch-ui.html`
- `src/timeline/*`
- `src/forensics/*`

4. Export/report usefulness from same workflow
- Keep export/report actions directly usable after batch/case flow without manual recovery steps.
- Make export/report failures explicit with action-specific messaging.
- Preserve provenance fields needed for downstream audit use.

Candidate code surfaces:
- `ui/hypersnatch-ui.html`
- `src/export/*`
- `src/reporting/*`
- `src/main.js` export IPC handlers

## Explicit Non-Goals (Slice 1)

- No random redesign or visual-only styling pass.
- No expansion sprawl into unrelated feature modules.
- No unrelated feature creep outside slice outcome targets.
- No version bump (`package.json`, `VERSION.json`, release tags) during slice implementation.

## Implementation Sequence

1. Queue truth path
- Implement truthful queue transitions tied to decode outcomes.
- Add deterministic tests for transition integrity.

2. Case/workspace continuity
- Implement case context continuity between decode and workspace actions.
- Add regression tests for stale-state prevention.

3. Trust/evidence readability under load
- Implement clear trust/evidence state messaging during queue and case updates.
- Add UI assertions for empty/loading/success/warn/error surfaces.

4. Export/report action reliability in flow
- Implement explicit export/report success/failure status and path feedback.
- Add tests for blocked/canceled/error paths.

## Gate Policy for First Real Code Slice

After first meaningful code lands, rerun:

```bash
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
```

Run additionally when proof/release paths are modified:

```bash
npm run audit:final
```

## Commit Buckets

- `feat(expansion): ...`
- `feat(ui): ...`
- `test(ui): ...`
- `docs(scope): ...`

## Slice 1 Exit Criteria

- At least one operator-facing workflow is materially improved (not cosmetic).
- Queue, case/workspace, trust/evidence, and export/report flow are coherent under normal and failure paths.
- New assertions are present in tests and `verify:ui` for introduced states.
- Required gates pass after code implementation.

## Hold Point Before Slice 2

Do not branch into additional v1.5.0 slices until Slice 1 is implemented and validated with the above gate set.
