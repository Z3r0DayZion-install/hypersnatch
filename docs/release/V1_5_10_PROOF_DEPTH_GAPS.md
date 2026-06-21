# v1.5.10 Proof Depth Gaps

Date: 2026-03-22  
Branch: `proof-upgrade/pdg-runtime-closure`

This file tracks what remains indirect after proof-upgrade execution and the required closure path per gap.

## Remaining Gaps

| Gap ID | Severity | Indirect Zone | Why Still Indirect | Status | Closure Type | Closure Path |
|---|---|---|---|---|---|---|
| PDG-01 | P1 | Full packaged click-path execution in live Electron runtime (no IPC stub) | `e2e/operator_ui.spec.js` (slice 6, 12 tests passing) drives the real operator HTML with stubbed IPC bridge — click-paths are proven at UI/JS level; remaining gap is live packaged Electron IPC wiring (no stub) | MATERIALLY NARROWED (slice 6 — click-path E2E spec added) | Runtime-work later | extend E2E runner to drive the packaged Electron app directly (e.g. via `electron` launch in Playwright) without stub |
| PDG-02 | P1 | External trust acceptance for shipped binaries | trust boundary is now captured deterministically in-gate, but strict signoff still proves artifact/hash contract and does not by itself close signed trust-chain acceptance | BOUNDED-DEFERRED (materially narrowed in proof-upgrade) | Policy + runtime-work later | define/enforce signing contract and require signed evidence in stable release proof flow |
| PDG-03 | P1 | Wrapper behavior under fresh-machine install/use cycle | current proof validates artifact outputs and hashes, not full installer journey on clean host | Open | Runtime-work later | add reproducible installer lifecycle proof on clean host profile |
| PDG-04 | P2 | Cross-environment install reproducibility strength | clean install proof currently reflects documented environment, not broad environment matrix | Open | Script/doc later | add optional environment preflight and multi-host install evidence matrix |
| PDG-05 | P3 | Visual proof artifacts (screenshots/video) for operator paths | slice-3 evidence is CLI transcript based | Open | Doc-only | add optional screenshot/transcript index to future proof bundles |

## Proof-Upgrade Narrowing Achieved

1. Direct vs indirect classification is explicit across release-critical claims.
2. PDG-01 (slice 4): direct packaged method-level interaction assertions from `app.asar`, not marker-only packaged evidence.
3. PDG-01 (slice 6): `e2e/operator_ui.spec.js` — 12-test Playwright click-path spec against real operator HTML; all 12 tests pass. Covers decode, tab nav, case create/note/report/export/seal flows. IPC stubbed via `electronAPI`/`smartDecode` bridge.
4. PDG-02: deterministic in-gate signature-boundary capture, not manual-only trust-boundary checks.
5. Signoff language remains normalized and conservative with no expansion overclaim.

## Decision Impact

`v1.5.10` proof position is stronger after proof-upgrade execution, but expansion remains blocked until P1 packaged click-path and trust-contract gaps are closed or explicitly accepted in a fresh decision gate.
