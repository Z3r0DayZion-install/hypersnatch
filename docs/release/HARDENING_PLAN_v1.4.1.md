# Hardening Plan v1.4.1

Date: 2026-03-19
Branch: `release-readiness/v1.4.1-hardening`
Baseline: `v1.4.0` (`6cb0006d1edabfccf05be402a248c9baf29f47d9`)

## Purpose

Ship `v1.4.1` as a stable-line hardening release without expanding product scope.

## In Scope

- bug fixes only
- operator UX polish
- performance and stability cleanup
- packaging and release-path cleanup
- engine/runtime follow-through
- accessibility/focus/error-state refinement
- test and `verify:ui` strengthening

## Out of Scope

- major new feature surface
- architecture churn not tied to an active defect
- speculative refactors not tied to user-facing stability

## Change Acceptance Rule

If a change adds meaningful new capability, move it to `feat/v1.5.0-expansion`.

## Triage Queue (Post-v1.4.0 Rough Edges)

Prioritize by user-facing risk.

1. `P0` blocking defects (crashes, data loss, broken decode/export flow)
2. `P1` high-friction defects (misleading states, failed operator actions, a11y blockers)
3. `P2` polish defects (layout inconsistencies, clarity and responsiveness improvements)

## First Pass Checklist

- [ ] Collect post-1.4.0 rough edges into a single issue/doc list
- [ ] Rank each item (`P0/P1/P2`) with owner and target commit
- [ ] Fix shell/state/export/progress polish items first
- [ ] Tighten tests around each fixed defect
- [ ] Strengthen `verify:ui` where regressions are possible
- [ ] Run full branch gates before PR

## Branch Gates (Required)

```bash
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
npm run audit:final
```

## Release Proof Rule

Before tagging `v1.4.1`, rerun proof from a clean throwaway worktree at merged `origin/main`.
