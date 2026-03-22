# v1.5.10 Packaged Interaction Proof

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This document records what packaged/runtime interaction truth is directly evidenced today and where the boundary remains indirect.

## Packaged Proof Surfaces

Artifacts under proof:

1. `dist/HyperSnatch-Setup-1.5.9.exe`
2. `dist/HyperSnatch_Vanguard_v1.5.9.zip`
3. `dist/SHA256SUMS.txt`
4. `dist/win-unpacked/resources/app.asar`

Command surfaces:

1. `npm run build:wrapper`
2. `npm run verify`
3. `npm run verify:ui`
4. `npm run audit:final`
5. `npm run audit:stable`

## Operator Reproduction Path (Exact Order)

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`
7. `npm run audit:stable`

## Expected Outcomes

1. `npm run build:wrapper`:
   - emits versioned bundle: `HyperSnatch_Vanguard_v1.5.9.zip`
   - regenerates hash artifacts (`SHA256SUMS.txt`, `MANIFEST.json`)
2. `npm run verify`:
   - validates installer and versioned bundle presence and hash
   - validates packaged `app.asar` marker presence
3. `npm run verify:ui`:
   - validates runtime semantics in UI harness (queue actions, reopen, report/export flows)
4. `npm run audit:final`:
   - must emit `SIGNOFF STATUS: NON-SIGNOFF`
5. `npm run audit:stable`:
   - must emit `SIGNOFF STATUS: APPROVED`

## Directly Observed Packaged Evidence

From `scripts/verify_release.js` packaged marker checks:

- `openCaseReportFromContext`
- `exportCaseReportFromContext`
- `reopenCaseJob`
- `buildCaseWorkspaceReport`
- `buildCaseTimeline`
- queue action markers:
  - `data-queue-action="pause"`
  - `data-queue-action="resume"`
  - `data-queue-action="manual-review"`
  - `data-queue-action="cancel"`
- `APP_VERSION_FALLBACK = "1.5.9"`

Direct evidence boundary:

1. These markers are directly read from packaged `app.asar`.
2. This proves packaged inclusion/marker presence, not full click-path execution in the packaged app process.

## Indirect/Inference Boundary

Currently indirect:

1. End-to-end packaged click execution for queue/manual-review/reopen/export workflows.
2. Human/operator interaction timing and UI state transitions under packaged runtime input events.
3. External OS trust prompts/acceptance behavior unless signing evidence is explicitly part of the run.

## Evidence Notes

1. Slice 3 is docs-only; no runtime behavior changes were introduced.
2. CLI gate logs are the primary evidence source for this slice.
3. Screenshot/video evidence was not captured in this slice and is not claimed.
