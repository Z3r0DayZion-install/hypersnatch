# v1.5.10 Runtime Interaction Proof

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This document captures the current packaged/runtime interaction evidence for slice 4 and its explicit boundary.

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
3. Harness runtime semantics evidence exists:
   - `npm run verify:ui` executes runtime function assertions for queue/reopen/report/export behavior

## Boundary Evidence (Why PDG-01 Is Not Directly Closed)

1. `ui_smoke_check.js` is source/harness-based:
   - reads `ui/hypersnatch-ui.html` directly (`scripts/ui_smoke_check.js` lines 7-8)
   - compiles functions from source text (`extractFunctionSource` / `compileRuntimeFunction`)
2. No packaged click-path runner currently exists in `scripts/` for automated packaged UI interaction execution.
3. Current packaged proof therefore remains direct at marker-level, not full packaged click-path execution.

## Boundary Evidence (Why PDG-02 Is Not Directly Closed)

1. Direct signature checks on current artifacts:
   - `Get-AuthenticodeSignature dist/HyperSnatch-Setup-1.5.9.exe` -> `Status: NotSigned`
   - `Get-AuthenticodeSignature dist/win-unpacked/HyperSnatch.exe` -> `Status: NotSigned`
2. Current strict signoff contract proves artifact/hash/signoff policy, not external trust-store acceptance.
3. External trust acceptance remains conditional on explicit signing contract and evidence.

## Direct vs Inferred Summary

| Surface | Current Evidence | Classification |
|---|---|---|
| Packaged artifact generation and hash/signoff contract | direct command/artifact evidence | Direct |
| Packaged runtime marker inclusion in `app.asar` | direct artifact inspection | Direct (marker-level) |
| Packaged click-path interaction execution | no packaged interaction runner evidence | Indirect / bounded |
| External trust acceptance for binaries | binaries currently not signed | Indirect / bounded |
