# Post-v1.5.1 Operator Friction Audit

Date: 2026-03-20  
Branch: `post-release/v1.5.1-reality-audit`  
Baseline: `origin/main` at `3bbcb44586fff053a9b0c392c4a6ff5118a6cc48`

## Scope and Method

- Reviewed shipped `v1.5.1` workflow surfaces (queue, case, trust, reporting, lineage, export).
- Reviewed current proof surfaces (`verify:ui`, `verify`, `audit:final`, setup docs).
- Used stable-order gate evidence from clean merged-main proof.

## Triage

### P0 (Release Blockers)

No confirmed P0 operator-flow breakages from current evidence.

### P1 (Should Harden Before Expansion)

#### P1-1 Export/Artifact truth can drift in dirty worktrees

- Symptom: verification/audit can validate a setup exe that is not explicitly tied to current package version when multiple installers exist in `dist`.
- Operator impact: proof confidence drops because pass output can reference a stale installer artifact.
- Affected areas: export truthfulness, audit clarity.
- Recommended hardening: require installer filename/version match to `package.json` in both `verify` and `audit:final`.

#### P1-2 WARN-mode audit policy is explicit but still soft by default

- Symptom: `audit:final` passes with warnings when CLI/hash strictness is not enabled.
- Operator impact: manual interpretation is still required to decide whether proof is strict enough for a given release claim.
- Affected areas: audit clarity, trust posture.
- Recommended hardening: codify stable audit profile (strict or explicitly bounded warn-profile contract).

#### P1-3 UI proof depth does not execute runtime interaction flows

- Symptom: current `verify:ui` asserts many critical hooks/strings but does not drive live queue/case/report/lineage transitions.
- Operator impact: state-truth regressions can slip through if hooks remain present but behavior changes.
- Affected areas: queue truth, case trust rollups, report usefulness, lineage readability, export truthfulness.
- Recommended hardening: add runtime assertions for key operator transitions (pause/resume/manual-review/reopen/report/export fail states).

#### P1-4 Post-release status narrative is behind shipped truth

- Symptom: status docs still describe `1.5.1` as target/in-progress instead of current stable.
- Operator impact: onboarding/review confidence friction, weaker release-story trust.
- Affected areas: audit clarity, governance.
- Recommended hardening: normalize post-ship status and release-proof references for `v1.5.1`.

### P2 (Minor Friction / Backlog)

#### P2-1 Dependency install warnings remain possible across environments

- Symptom: deprecation/engine warnings can still appear depending on runtime and resolver context.
- Operator impact: low immediate runtime risk, moderate confidence noise.
- Affected areas: setup/dependency friction.

#### P2-2 Optional CLI/hash strictness remains non-default

- Symptom: strict mode requires environment flags.
- Operator impact: low if policy is documented; medium if team assumes default equals strict.
- Affected areas: audit clarity.

### P3 (Optional Future Polish)

#### P3-1 Non-critical warning noise cleanup

- Rust warning and non-blocking console noise can be reduced for cleaner release logs.

## Operator Friction Conclusion

No confirmed blocker-level regressions, but there are real P1 trust/proof frictions that are hardening work, not expansion work.

