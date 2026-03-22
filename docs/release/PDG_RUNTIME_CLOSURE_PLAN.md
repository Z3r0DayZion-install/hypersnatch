# PDG Runtime Closure Plan

Date: 2026-03-22  
Branch: `proof-upgrade/pdg-runtime-closure`

## Phase 1 Working Summary

### PDG-01 (Packaged Runtime Interaction Proof)

Interpretation:

1. Current proof directly verifies packaged marker presence in `app.asar`.
2. Current interaction semantics are proven from source/harness (`ui/hypersnatch-ui.html`), not packaged runtime code.
3. Missing direct evidence is execution of operator-critical runtime interaction functions from packaged artifact content.

What can be directly tested now without widening scope:

1. Execute packaged function logic extracted from `dist/win-unpacked/resources/app.asar` for:
   - queue action handling
   - reopen flow
   - case report launch/export blocked and success states
2. Verify deterministic status/action/output semantics from packaged runtime code path.

What cannot be directly tested in this slice without widening scope:

1. Full packaged click-path E2E event loop execution in a live Electron UI session.
2. Full GUI automation of controls in packaged app process.

### PDG-02 (External Trust Acceptance Proof)

Interpretation:

1. Current strict signoff proves artifact/hash contract.
2. Current trust acceptance evidence is documented/manual (`Get-AuthenticodeSignature`), not in-gate deterministic proof output.
3. Missing direct evidence is deterministic capture of binary signature state in the same verification flow.

What can be directly tested now without widening scope:

1. Deterministic Authenticode signature-state capture for:
   - `dist/HyperSnatch-Setup-1.5.9.exe`
   - `dist/win-unpacked/HyperSnatch.exe`
2. Explicit boundary classification in gate output (`signed`, `unsigned-bounded`, `mixed`).

What cannot be directly tested in this slice without widening scope:

1. External trust acceptance closure requiring signed artifacts and enforced signing policy contract.
2. Multi-host trust-store acceptance matrix.

## Target Outcomes

### PDG-01 Target

Materially narrow gap by moving from marker-only packaged proof to packaged runtime-function execution proof from `app.asar`.

### PDG-02 Target

Materially narrow gap by moving from manual trust boundary checks to deterministic in-gate signature boundary evidence.

## Proposed Direct Evidence Path

1. Add minimal packaged runtime proof harness script that:
   - reads packaged `app.asar`
   - extracts targeted runtime functions
   - executes deterministic interaction assertions with controlled mocks
2. Integrate harness call into `npm run verify` (`scripts/verify_release.js`) so evidence appears in required gate order.
3. Add minimal binary signature boundary check support to `npm run verify` on Windows.

## Code/Script Support Needed

Yes, minimal support is required:

1. A proof harness for packaged runtime interaction assertions.
2. A deterministic signature boundary probe.
3. Narrow integration in `verify_release.js`.

No product feature surface changes are planned.

## Scope-Creep Risk

Primary risk areas:

1. Turning proof harness into full UI automation framework.
2. Pulling in new dependencies for packaging/UI automation.
3. Conflating trust-boundary evidence with release-signing policy rollout.

Mitigations:

1. Keep assertions limited to already-documented PDG-01/PDG-02 behavior.
2. Use no dependency churn.
3. Keep claims bounded; do not imply `v1.6.0` readiness.

## Stop Conditions

Stop and keep bounded-deferred status if any of the following occur:

1. Packaged function extraction cannot be done deterministically without tooling/dependency expansion.
2. Signature-state capture cannot run deterministically in current gate environment.
3. Proposed changes require feature/runtime capability changes beyond proof capture.
4. Evidence quality does not improve directness over current baseline.
