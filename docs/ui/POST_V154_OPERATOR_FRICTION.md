# Post-v1.5.4 Operator Friction Audit

Date: 2026-03-20  
Branch: `post-release/v1.5.4-reality-audit`  
Baseline: `origin/main` at `1af07878f2269e0f56c320c2955a1cb386118f80`

## Scope and Method

- Reviewed shipped `v1.5.4` operator and proof surfaces.
- Reviewed top-level status/governance docs versus shipped truth.
- Classified friction by release trust and operator reliability impact.

## Triage

### P0 (Release Blockers)

No confirmed P0 runtime breakages from current evidence.

### P1 (Should Harden Before Expansion)

#### P1-1 Governance/status drift immediately after `v1.5.4` ship

- Symptom: key top-level docs still report `v1.5.3` as current stable.
- Operator impact: maintainers/reviewers receive contradictory project truth.
- Affected areas: onboarding confidence, release narrative integrity.
- Recommended hardening: one narrow governance alignment pass after `v1.5.4`.

#### P1-2 WARN default still depends on operator discipline

- Symptom: default non-strict audit mode remains available and can be over-interpreted by low-discipline workflows.
- Operator impact: potential false-confidence signoff if strict stable contract is not followed.
- Affected areas: release signoff policy reliability.
- Recommended hardening: tighten default release-type policy and/or add strict stable signoff wrapper path.

#### P1-3 UI proof still not full interaction execution

- Symptom: runtime helper execution is stronger than regex checks but does not yet run browser-level transition choreography.
- Operator impact: interaction regressions may evade proof if helper semantics remain intact.
- Affected areas: queue/case/report/export/lineage interaction trust.
- Recommended hardening: add higher-fidelity interaction proof checks for critical flows.

### P2 (Minor Friction / Backlog)

#### P2-1 Clean-worktree install still emits non-blocking deprecation warnings

- Symptom: npm install logs transitive warning noise.
- Operator impact: low; informational unless warning class changes.
- Recommended action: continue inventory tracking and classify changes.

### P3 (Optional Future Polish)

#### P3-1 Additional ergonomics around strict-signoff command paths

- Quality-of-life wrappers can be added later if needed.

## Operator Friction Conclusion

No blocker-level defects are currently evidenced, but meaningful P1 trust/proof/governance frictions remain active.  
A narrow `v1.5.5` hardening pass is the safer next line before opening `v1.6.0` expansion.
