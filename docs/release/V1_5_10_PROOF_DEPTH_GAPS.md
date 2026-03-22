# v1.5.10 Proof Depth Gaps

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This file tracks what remains indirect after slice 3 and the required closure path per gap.

## Remaining Gaps

| Gap ID | Severity | Indirect Zone | Why Still Indirect | Closure Type | Closure Path |
|---|---|---|---|---|---|
| PDG-01 | P1 | Packaged UI click-path execution for queue/manual-review/reopen/export | current packaged proof reads marker presence from `app.asar`; it does not execute packaged event loop interactions | Runtime-work later | add packaged interaction runner/assertions that execute operator flows in packaged context |
| PDG-02 | P1 | External trust acceptance for shipped binaries | strict signoff proves artifact/hash contract, not OS trust-store acceptance by itself | Policy + runtime-work later | define signing contract and require explicit signing evidence in stable release proof |
| PDG-03 | P1 | Wrapper behavior under fresh-machine install/use cycle | current proof validates artifact outputs and hashes, not full installer journey on clean host | Runtime-work later | add reproducible installer lifecycle proof on clean host profile |
| PDG-04 | P2 | Cross-environment install reproducibility strength | clean install proof currently reflects documented environment, not broad environment matrix | Script/doc later | add optional environment preflight and multi-host install evidence matrix |
| PDG-05 | P3 | Visual proof artifacts (screenshots/video) for operator paths | slice-3 evidence is CLI transcript based | Doc-only | add optional screenshot/transcript index to future proof bundles |

## Slice 3 Closure Achieved

1. Direct vs indirect classification is explicit across release-critical claims.
2. Packaged interaction proof boundary is documented with concrete commands and expected outcomes.
3. Signoff language is normalized to prevent overclaiming.

## Decision Impact

`v1.5.10` is stronger after slice 3, but expansion remains blocked until P1 packaged interaction and trust-contract gaps are closed or formally accepted with explicit downgrade rationale.
