# Post-v1.5.2 Reality Audit

Date: 2026-03-20  
Branch: `post-release/v1.5.2-reality-audit`  
Baseline: `origin/main` at `3b4153221192d6985574a32f6fa66d11859d65d4`

## Locked Release Facts

- Stable release: `v1.5.2`
- Hardening merge: `2b475c645e81e511a8b416aecf7f9ba7a8e1a719`
- Identity merge: `9d83a50471810259adbe6269d4dac92280c5ee9c`
- Proof-doc merge: `3b4153221192d6985574a32f6fa66d11859d65d4`
- Tag: `v1.5.2`
- Tag object: `2c6d5de89a2ce41fe0e80f9494c0c499053ebd54`
- Artifact: `HyperSnatch_Vanguard_v1.5.2.zip`
- SHA256: `84c0861cc5e493c9ad9aa15e38167a69bbe208ebc8113fb834054fa5245546ea`

## Stable-Order Evidence

Clean merged-main proof sequence for `v1.5.2`:

- `npm install` PASS
- `npm test` PASS
- `npm run verify:ui` PASS
- `npm run build:wrapper` PASS
- `npm run verify` PASS
- `npm run audit:final` PASS (`PASS WITH WARNINGS: 2` by explicit policy)

Identity truth on merged main:

- `package.json`: `1.5.2`
- `VERSION.json`: `1.5.2`
- Built artifact: `dist/HyperSnatch_Vanguard_v1.5.2.zip`
- Clean proof worktree used for release/tag

## What Is Objectively Strong

1. Stable-order release proof discipline is repeatable and documented.
2. Version-pinned installer checks now reject stale setup exes in `dist`.
3. Verify/build dependency truth is explicit (`verify` requires build artifacts; remediation message is clear).
4. UI proof checks are materially deeper than baseline shell checks and cover queue/case/report/lineage hooks.
5. `audit:final` WARN profile is explicit and no longer hidden/ambiguous.
6. `v1.5.2` proof record now exists on `main` as a permanent audit surface.

## What Is Still Weak

1. `audit:final` default profile remains WARN-permissive (`requireHash=no`, `requireCli=no`).
2. WARN profile is clear, but stable release strictness policy is still operator-decision dependent.
3. `verify:ui` is still static/source-hook heavy and does not execute runtime interaction flows end-to-end.
4. Governance/status top-level narrative lags shipped truth (`README.md` and `docs/PROJECT_STATUS.md` still anchored to `1.5.1`/`v1.5.2-hardening` state).
5. Dependency warning inventory and setup-note references are still version-anchored to `v1.5.1` artifacts.

## Acceptable Debt

1. WARN profile can remain default if release policy explicitly states when strict CLI/hash mode is mandatory.
2. Non-blocking Rust `dead_code` warning noise can remain observation-level.
3. Environment-specific npm deprecation warnings can remain observation-level unless they impact proof reproducibility.

## Real Release-Risk Items

1. Governance lag can create contradictory release-state narratives despite correct code/tag history.
2. WARN-mode audit remains vulnerable to weak operator interpretation if strictness is not codified per release type.
3. UI proof still has a behavioral gap between hook-presence checks and live transition truth.

## Proof Surface Assessment

| Surface | Current Strength | Notes |
|---|---|---|
| Stable gate order / clean-worktree proof | Strong | Deterministic and repeatedly validated |
| Version-pinned artifact proof | Strong | Stale installer rejection is explicit and enforced |
| Verify/build dependency truth | Strong | Precondition and remediation text are explicit |
| Final audit strictness policy | Medium | Visible WARN profile, still soft by default |
| UI operator-state proof depth | Medium | Broad static assertions, limited runtime execution |
| Governance/status narrative cohesion | Medium-Weak | Main status surfaces lag shipped `v1.5.2` truth |

## Audit Conclusion

`v1.5.2` is a legitimate stable release with a clean proof chain.  
Evidence is improved but still mixed for immediate expansion because trust/proof governance surfaces are not yet uniformly strict and current across operator-facing documentation.