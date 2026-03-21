# Post-v1.5.6 Operator Friction Audit

Date: 2026-03-21  
Branch: `post-release/v1.5.6-reality-audit`

## Classification

- P0 = release blocker
- P1 = should harden before expansion
- P2 = minor friction / backlog
- P3 = optional polish

## P0 (Release Blockers)

- None found for shipped `v1.5.6`.

## P1 (Should Harden Before Expansion)

### P1-1 WARN-default signoff still operator-discipline sensitive

- Surface: `npm run audit:final`
- Symptom: output is explicit and blocked for signoff, but default path remains WARN/internal.
- Operator impact: strict signoff can still be skipped by undisciplined workflows.
- Recommended hardening: tighten default signoff guardrails and strict rerun signaling further.

### P1-2 Runtime UI proof still short of full interaction-level coverage

- Surface: `npm run verify:ui`
- Symptom: interaction checks improved, but full operator-flow transition coverage is not complete.
- Operator impact: residual trust gap between claimed workflow truth and interaction-proof depth.
- Recommended hardening: expand interaction-level assertions around queue state transitions, reopen flows, and export/report transitions.

### P1-3 Governance/status truth lag after stable ship

- Surface: top-level status/setup docs
- Symptom: top-level narrative still references `v1.5.5` stable state after shipped `v1.5.6`.
- Operator impact: onboarding and review context drift.
- Recommended hardening: immediate top-level governance alignment after each stable release.

## P2 (Minor Friction / Backlog)

### P2-1 Dependency deprecation warning noise

- Surface: clean `npm install`
- Symptom: transitive deprecation warnings remain (`whatwg-encoding`, `tar`, `glob`).
- Operator impact: low immediate impact, medium maintenance signal.
- Recommendation: continue warning inventory and reduce transitive warning debt opportunistically.

## P3 (Optional Future Polish)

### P3-1 Report readability concision for large datasets

- Surface: report readability at scale
- Symptom: structured output is useful but can still be dense in larger snapshots.
- Operator impact: low.
- Recommendation: defer to future expansion/polish scope.

## Friction Verdict

No capability blockers were found, but trust/signoff/governance P1 issues remain.  
That supports one more narrow hardening release before opening `v1.6.0` expansion.
