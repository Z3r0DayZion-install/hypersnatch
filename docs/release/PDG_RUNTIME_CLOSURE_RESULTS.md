# PDG Runtime Closure Results

Date: 2026-03-22  
Branch: `proof-upgrade/pdg-runtime-closure`

## Scope Outcome

This proof-upgrade slice stayed on proof depth only:

1. No feature expansion.
2. No UX redesign.
3. No version bump.
4. Minimal proof-support script changes only.

## Runtime/Code Surface Change Summary

Minimal proof-support changes were introduced:

1. `scripts/verify_packaged_runtime_interactions.js`
   - direct packaged runtime-function assertions from `app.asar`
2. `scripts/verify_binary_signature_boundary.js`
   - deterministic in-gate Authenticode boundary capture
3. `scripts/verify_release.js`
   - integrated both checks into `npm run verify`

No product capability expansion was introduced.

## PDG Closure Results

### PDG-01

Status: **BOUNDED-DEFERRED (materially narrowed)**

Direct evidence now added:

1. Packaged runtime assertions run from `dist/win-unpacked/resources/app.asar`.
2. `npm run verify` now validates packaged runtime semantics for:
   - `handleQueueAction`
   - `reopenCaseJob`
   - `openCaseReportFromContext`
   - `exportCaseReportFromContext`
3. Current assertion count: `20`.

Why still deferred:

1. Full packaged click-path E2E event-loop execution is still not directly automated.
2. Current closure is method-level packaged runtime semantics, not full packaged GUI click-path proof.

### PDG-02

Status: **BOUNDED-DEFERRED (materially narrowed)**

Direct evidence now added:

1. `npm run verify` now captures deterministic binary signature boundary status.
2. Current boundary classification is `unsigned-bounded`.
3. Current installer/unpacked evidence is unsigned-boundary status with no signer subject.

Why still deferred:

1. External trust acceptance closure requires explicit signing contract and signed-evidence workflow.
2. Artifact/hash signoff evidence remains primary; signed trust-chain closure is not claimed.

## Truth-State Decision

1. PDG-01 is not honestly closable in this slice without widening into full packaged GUI automation scope.
2. PDG-02 is not honestly closable in this slice without widening into signing-policy/signing-evidence rollout scope.
3. Expansion remains blocked.

## Validation Gate Results (Candidate Head)

Required order executed and passed:

1. `npm install` - PASS
2. `npm test` - PASS
3. `npm run verify:ui` - PASS
4. `npm run build:wrapper` - PASS
5. `npm run verify` - PASS
   - packaged runtime interaction assertions from `app.asar`: PASS (`20` assertions)
   - binary trust boundary probe: PASS (`boundaryClass=unsigned-bounded`)
6. `npm run audit:final` - PASS (`SIGNOFF STATUS: NON-SIGNOFF`)
7. `npm run audit:stable` - PASS (`SIGNOFF STATUS: APPROVED`)
8. `node -p "require('./package.json').version"` - `1.5.9`
9. `type VERSION.json` - `1.5.9`
10. `git status --short --branch` - clean except branch changes in this proof-upgrade slice
