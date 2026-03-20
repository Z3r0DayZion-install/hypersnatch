# Post-v1.5.0 Operator Friction Audit

Date: 2026-03-19
Branch: `post-release/v1.5.0-reality-audit`

## Scope and Method

- Used shipped `v1.5.0` mainline state.
- Ran gate-backed validation (`npm test`, `verify:ui`, `build:wrapper`, `verify`, `audit:final`).
- Reviewed workflow-relevant proof surfaces (queue/case/report/lineage hooks via current smoke/gate signals).

## Triage (P0 / P1 / P2)

### P0

No confirmed P0 operator-flow failures found in current evidence.

### P1

#### P1-UI-1 Operator proof signal is weaker than release claim depth

- Symptom: UI smoke gate confirms core hooks, but does not validate deeper operator truth states end-to-end (manual-review/failure visibility paths in full workflow context).
- Repro steps:
1. Run `npm run verify:ui`
2. Observe pass criteria are smoke-level presence checks.
- User/operator impact: risk of undetected UI truth regressions between queue/case/report states.
- Likely fix: strengthen `verify:ui` assertions for warning/failed/manual-review rendering and case/report truth transitions.
- Belongs to: `v1.5.1`

### P2

#### P2-UI-1 No confirmed keyboard/focus regression, but current proof depth is limited

- Symptom: no failing evidence currently, but full keyboard/focus traversal is not comprehensively asserted by automation.
- Repro steps:
1. Review current `verify:ui` checks
2. Note limited depth for focus-order and overflow-case assertions.
- User/operator impact: low immediate risk; medium long-term QA confidence gap.
- Likely fix: add targeted UI acceptance checks without UI redesign.
- Belongs to: `v1.5.1` if included as hardening, otherwise `v1.6.0` baseline strengthening.

## Operator Friction Conclusion

No release-breaking operator regressions are currently confirmed, but proof-depth friction is real enough to justify a narrow hardening pass before further expansion.
