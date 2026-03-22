# Post-v1.5.9 Operator Friction Audit

Date: 2026-03-22  
Branch: `post-release/v1.5.9-reality-audit`

## Classification

- P0 = release blocker
- P1 = should harden before expansion
- P2 = minor friction / backlog
- P3 = optional polish

## P0 (Release Blockers)

- None found for shipped `v1.5.9`.

## P1 (Should Harden Before Expansion)

### P1-1 Governance/status/setup surfaces still lag shipped truth

- Surfaces: `README.md`, `docs/PROJECT_STATUS.md`, `docs/agent/MASTER_OVERVIEW.md`, `docs/dev/WORKTREE_SETUP_NOTES.md`
- Symptom: surfaces still describe `v1.5.8` stable state and `v1.5.9-hardening` as current lane after `v1.5.9` ship.
- Operator impact: onboarding/review context drift and stale lane guidance.
- Recommended hardening: immediate sync to shipped `v1.5.9` truth and next-line status.

### P1-2 Dependency warning baseline not on current shipped line

- Surfaces: dependency warning inventory and setup references
- Symptom: latest baseline doc is still `DEPENDENCY_WARNING_INVENTORY_v1.5.8.md`.
- Operator impact: setup confidence and warning-cadence evidence are one release behind.
- Recommended hardening: refresh baseline to `v1.5.9` with current install evidence and explicit classification.

### P1-3 Packaged proof remains stronger-but-indirect

- Surfaces: `npm run verify` packaged marker checks + `npm run verify:ui` harness checks
- Symptom: proofs are materially stronger, but still rely on marker/runtime-harness assertions rather than full packaged interaction E2E.
- Operator impact: residual trust gap on highest-value interaction transitions.
- Recommended hardening: deepen packaged interaction assertions for critical operator workflows.

## P2 (Minor Friction / Backlog)

### P2-1 Clean-worktree discipline remains strict for artifact clarity

- Surface: verify/build artifact checks
- Symptom: stale mixed artifacts intentionally fail proof (correct behavior) and require strict clean-worktree hygiene.
- Operator impact: low when release flow is followed.
- Recommendation: keep strict check; continue emphasizing clean-worktree release flow.

### P2-2 Install warning signal can vary across environments

- Surface: `npm install` warning output
- Symptom: transitive deprecation warnings can appear in some clean runs and not in others.
- Operator impact: low-to-medium observability noise.
- Recommendation: document variability and keep evidence snapshots current each release line.

## P3 (Optional Future Polish)

### P3-1 Non-critical UX/readability polish

- Surface: large report/readability ergonomics.
- Symptom: no correctness issue; quality-of-life opportunities remain.
- Operator impact: low.
- Recommendation: defer to explicit expansion/polish planning.

## Friction Verdict

`v1.5.9` is operationally strong, but trust/governance/proof-depth P1 friction is still present.  
This is improved state, not yet friction-free state.
