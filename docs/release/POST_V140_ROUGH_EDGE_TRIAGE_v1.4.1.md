# Post-v1.4.0 Rough Edge Triage (v1.4.1)

Date: 2026-03-19
Branch: `release-readiness/v1.4.1-hardening`
Baseline: `v1.4.0` (`6cb0006d1edabfccf05be402a248c9baf29f47d9`)

## P0 (Must Fix Before v1.4.1)

### P0-1 Decode success is overstated when no viable result exists
- Symptom: decode flow always sets `"Decode execution completed successfully."` after `render(out)`.
- User impact: operator sees success messaging even when no candidates/best are available; trust signal is wrong.
- Repro steps:
  1. Open UI and run decode on payload that returns empty candidates/refusals.
  2. Observe success status despite no executable extraction target.
- Proposed fix: derive decode outcome from returned payload (`candidates`, `best`, `refusals`, `batch jobs`) and map to `ok/warn/bad` statuses.
- Test/gate impact: strengthen `verify:ui` to require decode outcome evaluation path and status semantics.

### P0-2 Trust proof seal is generated from randomness instead of result data
- Symptom: audit seal hash text is generated from `Math.random()` in `render(...)`.
- User impact: proof marker can imply integrity while being nondeterministic and not tied to the output payload.
- Repro steps:
  1. Run same decode twice with same input.
  2. Observe different seal values unrelated to payload changes.
- Proposed fix: compute deterministic digest from result JSON (SHA-256 with fallback hash path), update seal text from computed digest.
- Test/gate impact: `verify:ui` should fail if random-seal pattern reappears.

### P0-3 Decode failure leaves stale prior results/trust state visible
- Symptom: decode errors set bad status but prior results remain on-screen, including prior trust seal/candidates.
- User impact: intake state and displayed result/trust panel can desync; operator may act on stale output.
- Repro steps:
  1. Run decode that succeeds.
  2. Run decode that throws (bridge down/malformed input).
  3. Observe previous result still displayed after failure.
- Proposed fix: clear render state when a new decode begins and normalize trust panel/loading state before completion.
- Test/gate impact: `verify:ui` should assert pending trust state string and no stale-proof random logic.

### P0-4 Case export filename uses wrong case identifier key
- Symptom: `exportActiveCase()` builds filename using `this.activeCase.id` while case model uses `case_id`.
- User impact: export path may be `export_undefined_<timestamp>.*`, harming traceability and operator trust.
- Repro steps:
  1. Open existing case.
  2. Export as JSON/CSV.
  3. Observe filename prefix includes `undefined`.
- Proposed fix: use `this.activeCase.case_id` (with fallback + guard) for filename generation.
- Test/gate impact: `verify:ui` should assert use of `case_id` in export path construction.

### P0-5 Export error handling is not explicit for all failure paths
- Symptom: `exportNotes()` lacks try/catch for thrown IPC errors; `exportActiveCase()` assumes successful IPC return shape.
- User impact: silent or ambiguous failures in export flow can be interpreted as successful operations.
- Repro steps:
  1. Trigger export IPC failure (missing path/permission/backend throw).
  2. Observe inconsistent user feedback between status and actual persistence.
- Proposed fix: harden both export handlers with explicit error pathways and success checks (`res.success` where provided).
- Test/gate impact: `verify:ui` should require explicit failure-status strings for exports.

## P1 (Should Fix In v1.4.1)

### P1-1 Progress/status wording is inconsistent across decode states
- Symptom: mixed phrasing across initial/progress/completion states and radar labels.
- User impact: weaker operator confidence during active decode.
- Repro steps: run decode end-to-end and observe status/radar transitions.
- Proposed fix: normalize progress, success, warn, and error messaging.
- Test/gate impact: `verify:ui` string checks for stable decode state labels.

### P1-2 Trust panel state clarity under empty/loading/error can be improved
- Symptom: seal/panel wording does not clearly distinguish pending vs empty vs failed runs.
- User impact: operators infer certainty where none exists.
- Repro steps: compare initial load, in-flight decode, failed decode.
- Proposed fix: add explicit trust-panel status text for each state.
- Test/gate impact: extend `verify:ui` checks for trust status labels.

### P1-3 Export UX copy and path messaging could be more concrete
- Symptom: status messages are not fully consistent in path-first, error-first language.
- User impact: slower operator confirmation and higher retry rate.
- Repro steps: run note/case export success and failure scenarios.
- Proposed fix: normalize export success/failure copy including path or error reason.
- Test/gate impact: static checks for expected success/failure message patterns.

### P1-4 UI hardening acceptance evidence is missing for v1.4.1
- Symptom: no dedicated stable hardening acceptance record for this line yet.
- User impact: lower audit traceability for hardening decisions.
- Repro steps: inspect `docs/ui`; no `UI_HARDENING_ACCEPTANCE_v1.4.1.md`.
- Proposed fix: add acceptance doc with checks, changes, and intentional deferrals.
- Test/gate impact: docs-only, no runtime effect.

## P2 (Defer Unless Nearly Free)

### P2-1 Additional non-essential visual polish
- Symptom: minor animation/visual refinements are possible.
- User impact: cosmetic only.
- Repro steps: inspect transitions and micro-interactions.
- Proposed fix: defer to `v1.5.0` unless zero-risk.
- Test/gate impact: none required for v1.4.1.

### P2-2 Extended dashboard experimentation
- Symptom: opportunities for richer paneling and additional surface metrics.
- User impact: non-essential capability expansion.
- Repro steps: n/a.
- Proposed fix: move to `feat/v1.5.0-expansion`.
- Test/gate impact: feature-scope tests (out of v1.4.1).

### P2-3 Additional interaction flourishes
- Symptom: optional UI behavior enhancements beyond reliability.
- User impact: quality-of-life only.
- Repro steps: n/a.
- Proposed fix: defer unless nearly free and zero-risk.
- Test/gate impact: none for hardening line.

## Execution Order (v1.4.1)

1. Fix decode progress/success/failure truthfulness (P0-1, P0-3).
2. Fix export path and explicit failure handling (P0-4, P0-5).
3. Replace random trust seal with deterministic digest (P0-2).
4. Strengthen `verify:ui` for all above P0 protections.
5. Re-run full gates after each meaningful fix:
   - `npm test`
   - `npm run verify:ui`
   - `npm run verify`
   - `npm run build:wrapper`
