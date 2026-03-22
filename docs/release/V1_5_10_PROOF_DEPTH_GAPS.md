# v1.5.10 Proof Depth Gaps

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This file tracks what remains indirect after slice 4 and the required closure path per gap.

## Remaining Gaps

| Gap ID | Severity | Indirect Zone | Why Still Indirect | Status | Closure Type | Closure Path |
|---|---|---|---|---|---|---|
| PDG-01 | P1 | Packaged UI click-path execution for queue/manual-review/reopen/export | current packaged proof reads marker presence from `app.asar`; it does not execute packaged event loop interactions | Bounded-Deferred (slice 4) | Runtime-work later | add packaged interaction runner/assertions that execute operator flows in packaged context |
| PDG-02 | P1 | External trust acceptance for shipped binaries | strict signoff proves artifact/hash contract, not OS trust-store acceptance by itself; current artifacts are not signed | Bounded-Deferred (slice 4) | Policy + runtime-work later | define signing contract and require explicit signing evidence in stable release proof |
| PDG-03 | P1 | Wrapper behavior under fresh-machine install/use cycle | current proof validates artifact outputs and hashes, not full installer journey on clean host | Open | Runtime-work later | add reproducible installer lifecycle proof on clean host profile |
| PDG-04 | P2 | Cross-environment install reproducibility strength | clean install proof currently reflects documented environment, not broad environment matrix | Open | Script/doc later | add optional environment preflight and multi-host install evidence matrix |
| PDG-05 | P3 | Visual proof artifacts (screenshots/video) for operator paths | slice-3 evidence is CLI transcript based | Open | Doc-only | add optional screenshot/transcript index to future proof bundles |

## Slice 3-4 Closure Achieved

1. Direct vs indirect classification is explicit across release-critical claims.
2. Packaged interaction proof boundary is documented with concrete commands and expected outcomes.
3. Signoff language is normalized to prevent overclaiming.
4. PDG-01/PDG-02 are explicitly bounded-deferred with evidence-backed non-closure rationale.

## Decision Impact

`v1.5.10` is stronger after slice 4, but expansion remains blocked until P1 packaged interaction and trust-contract gaps are closed or explicitly accepted in a fresh decision gate.
