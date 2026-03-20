# Post-v1.5.2 Operator Friction Audit

Date: 2026-03-20  
Branch: `post-release/v1.5.2-reality-audit`  
Baseline: `origin/main` at `3b4153221192d6985574a32f6fa66d11859d65d4`

## Scope and Method

- Reviewed shipped `v1.5.2` workflow surfaces (queue, case, trust, reporting, lineage, export).
- Reviewed proof and verification surfaces (`verify:ui`, `verify`, `audit:final`, setup docs).
- Used clean merged-main proof evidence and release-proof records.

## Triage

### P0 (Release Blockers)

No confirmed P0 runtime breakages from current evidence.

### P1 (Should Harden Before Expansion)

#### P1-1 WARN-profile meaning can still be under-enforced operationally

- Symptom: `audit:final` passes with warnings unless strict CLI/hash flags are enabled.
- Operator impact: teams can treat WARN-mode pass as strict-release proof without an explicit release policy contract.
- Affected areas: audit clarity, trust posture.
- Recommended hardening: codify a stable release audit profile contract (when strict flags are mandatory).

#### P1-2 Governance/status narrative is lagging shipped truth

- Symptom: top-level status surfaces still read as `1.5.1`/hardening-in-progress after `v1.5.2` ship.
- Operator impact: review and onboarding confidence friction; release narrative appears inconsistent.
- Affected areas: governance truth, audit readability.
- Recommended hardening: update status/overview surfaces to reflect `v1.5.2` as current stable and active next-stage decision gate.

#### P1-3 UI proof depth still emphasizes hook presence over live behavior

- Symptom: `verify:ui` checks many critical contracts in static HTML/JS but does not execute end-to-end runtime transitions.
- Operator impact: behavior regressions can survive if hooks remain present while runtime flow drifts.
- Affected areas: queue truth, case trust rollups, report/lineage integrity, export truth.
- Recommended hardening: add runtime-oriented proof checks for transition truth (manual-review/reopen/export blocked/failure/report rendering).

#### P1-4 Dependency/setup governance references are partially stale

- Symptom: setup and warning-inventory docs still anchor to `v1.5.1` naming.
- Operator impact: minor but persistent friction in maintenance handoff clarity.
- Affected areas: dependency/setup confidence.
- Recommended hardening: normalize maintenance setup/warning inventory references to active stable line.

### P2 (Minor Friction / Backlog)

#### P2-1 Build-first verification adds workflow friction in reused worktrees

- Symptom: `verify` correctly fails when `dist` is missing or contaminated; this is truthful but can surprise operators.
- Operator impact: low if worktree discipline is followed; medium if users reuse dirty worktrees.
- Affected areas: setup friction.

#### P2-2 Warning noise remains in local build logs

- Symptom: transitive npm deprecation warnings and non-blocking Rust dead-code warning persist.
- Operator impact: low; mostly log clarity noise.

### P3 (Optional Future Polish)

#### P3-1 Additional UI interaction smoke depth

- Deeper runtime-browser interaction assertions can be added later if maintenance budget allows.

## Operator Friction Conclusion

No blocker-level defects are currently evidenced, but there are real P1 trust/proof/governance frictions that should be tightened before opening `v1.6.0` expansion.