# Post-v1.5.8 Operator Friction Audit

Date: 2026-03-21  
Branch: `post-release/v1.5.8-reality-audit`

## Classification

- P0 = release blocker
- P1 = should harden before expansion
- P2 = minor friction / backlog
- P3 = optional polish

## P0 (Release Blockers)

- None found for shipped `v1.5.8`.

## P1 (Should Harden Before Expansion)

### P1-1 Governance/status/setup truth still lags shipped state

- Surfaces: `README.md`, `docs/PROJECT_STATUS.md`, `docs/agent/MASTER_OVERVIEW.md`, `docs/dev/WORKTREE_SETUP_NOTES.md`
- Symptom: these still present `v1.5.7` and `release-readiness/v1.5.8-hardening` as current truth after `v1.5.8` ship.
- Operator impact: onboarding/review context drift and incorrect current-lane interpretation.
- Recommended hardening: immediate post-release governance sync to shipped `v1.5.8` and next active lane.

### P1-2 Runtime proof is improved but still indirect vs full packaged interaction truth

- Surfaces: `npm run verify:ui`, `scripts/ui_smoke_check.js`
- Symptom: queue/reopen/report/export/lineage checks are strong but largely harness-driven method/runtime assertions.
- Operator impact: residual confidence gap for true packaged workflow transitions under real operator interaction.
- Recommended hardening: add one more layer of packaged interaction assertions for operator-critical flows.

### P1-3 Dependency/setup warning baseline drift

- Surfaces: `npm install` output vs `docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.7.md`
- Symptom: current install emits deprecation warnings while baseline inventory still reflects prior line and no-warning state.
- Operator impact: setup confidence and maintenance cadence evidence become weaker than live reality.
- Recommended hardening: refresh warning inventory and setup narrative to current shipped line.

## P2 (Minor Friction / Backlog)

### P2-1 Clean-worktree discipline remains mandatory to avoid stale-artifact ambiguity

- Surface: `npm run verify`
- Symptom: mixed installer versions in reused worktrees fail deterministically (correct behavior) but add operator friction.
- Operator impact: low when release flow is followed; medium when operators reuse old worktrees.
- Recommendation: keep strict check; reinforce clean-worktree release flow reference in release docs.

### P2-2 Report/readability density at larger case volumes

- Surface: report and lineage readability under bigger snapshots.
- Symptom: truthfulness is strong, but scanability can still degrade as data grows.
- Operator impact: low to medium depending on workload size.
- Recommendation: defer to scoped UX/report polish once trust-layer items are closed.

## P3 (Optional Future Polish)

### P3-1 UX polish and interaction ergonomics beyond trust-critical flows

- Surface: non-critical UI polish.
- Symptom: no correctness issue; purely quality-of-life opportunities.
- Operator impact: low.
- Recommendation: reserve for post-`v1.6.0` product polish planning.

## Friction Verdict

`v1.5.8` removed the prior signoff blocker and stabilized release operations.  
Remaining friction is mostly trust/governance/proof P1, not feature capability debt.
