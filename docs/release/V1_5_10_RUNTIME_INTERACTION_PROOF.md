# v1.5.10 Runtime Interaction Proof

Date: 2026-03-22  
Branch: `proof-upgrade/pdg-runtime-closure`

This document captures current packaged/runtime interaction evidence for PDG runtime closure work and its explicit boundary.

## Scope

Focus:

1. PDG-01 (`packaged runtime click-path interaction proof`)
2. PDG-02 (`external trust acceptance evidence`)

Out of scope:

1. feature expansion
2. UI redesign
3. runtime behavior changes

## Directly Observed Evidence

1. Packaged artifacts are produced and version-aligned through:
   - `npm run build:wrapper`
   - `npm run verify`
2. Packaged marker-level runtime evidence exists:
   - `verify_release.js` reads `dist/win-unpacked/resources/app.asar`
   - required operator/runtime markers are validated in packaged artifact
3. Packaged runtime-function assertions now execute from `app.asar` via:
   - `scripts/verify_packaged_runtime_interactions.js`
   - integrated into `npm run verify` (`verify_release.js`)
   - current assertion count: `20`
   - validated packaged functions:
     - `handleQueueAction`
     - `reopenCaseJob`
     - `openCaseReportFromContext`
     - `exportCaseReportFromContext`
4. Harness runtime semantics evidence still exists:
   - `npm run verify:ui` executes broader source/harness assertions for queue/reopen/report/export behavior
5. Binary trust boundary evidence is now captured in-gate:
   - `scripts/verify_binary_signature_boundary.js`
   - integrated into `npm run verify` (`verify_release.js`)
   - current boundary class: `unsigned-bounded`
   - current installer/unpacked statuses: `Unknown` with no signer subject

## Boundary Evidence (Why PDG-01 Is Not Directly Closed)

1. Packaged runtime-function semantics are now directly executed from `app.asar`, but they are function-level assertions with mocked dependencies.
2. No full packaged click-path runner currently executes end-to-end event loop/DOM interaction in live packaged app context.
3. Current packaged proof is therefore:
   - direct for packaged marker presence and packaged function semantics
   - still indirect for full packaged click-path E2E interaction

## Boundary Evidence (Why PDG-02 Is Not Directly Closed)

1. Signature-state capture is now deterministic and in-gate (`npm run verify`), not manual-only.
2. Current status remains unsigned-boundary evidence (no signer subject on checked binaries).
3. Current strict signoff contract still proves artifact/hash/signoff policy, not external trust-store acceptance closure.
4. External trust acceptance remains conditional on explicit signing contract and signed-evidence workflow.

## Direct vs Inferred Summary

| Surface | Current Evidence | Classification |
|---|---|---|
| Packaged artifact generation and hash/signoff contract | direct command/artifact evidence | Direct |
| Packaged runtime marker inclusion in `app.asar` | direct artifact inspection | Direct (marker-level) |
| Packaged runtime interaction semantics (`handleQueueAction`, `reopenCaseJob`, `openCaseReportFromContext`, `exportCaseReportFromContext`) | direct packaged function assertions from `app.asar` in `npm run verify` | Direct (method-level) |
| Full packaged click-path E2E interaction execution | no packaged event-loop click-path runner evidence | Indirect / bounded |
| Signature-state capture for installer/unpacked app | deterministic Authenticode probe in `npm run verify` | Direct (boundary capture) |
| External trust acceptance for binaries | unsigned-boundary evidence, no signed trust-chain evidence | Indirect / bounded |
