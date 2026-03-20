# Post-v1.5.4 Reality Audit

Date: 2026-03-20  
Branch: `post-release/v1.5.4-reality-audit`  
Baseline: `origin/main` at `1af07878f2269e0f56c320c2955a1cb386118f80`

## Locked Release Facts

- Stable release: `v1.5.4`
- Hardening merge: `4be2a61b3eb3bd9754fe0ff238dd6c43e9261c2b`
- Identity merge: `48b00475766ed36b17807bd8b56e687f41e8ad2c`
- Proof-doc merge: `1af07878f2269e0f56c320c2955a1cb386118f80`
- Tag: `v1.5.4`
- Tag object: `eb648ce9a523873fab264c0d9d3a47755405e6cd`
- Artifact: `HyperSnatch_Vanguard_v1.5.4.zip`
- SHA256: `29315d6886c79b198a3f35c1c2661f0c8a0fe4931deb70bca614d9d245b7da33`

## Stable-Order Evidence

Clean merged-main proof sequence for `v1.5.4`:

- `npm install` PASS
- `npm test` PASS
- `npm run verify:ui` PASS
- `npm run build:wrapper` PASS
- `npm run verify` PASS
- `npm run audit:final` PASS (explicit WARN profile)

Identity truth on merged main:

- `package.json`: `1.5.4`
- `VERSION.json`: `1.5.4`
- Built artifact: `dist/HyperSnatch_Vanguard_v1.5.4.zip`
- Clean proof worktree used for release/tag

## What Is Objectively Strong

1. `v1.5.4` proof chain is complete and immutable (hardening merge, identity merge, tag, release asset, digest, proof doc).
2. WARN-profile audit output now clearly distinguishes non-signoff runs from strict stable signoff runs.
3. Artifact/version proof pinning remains strict (`verify` and `audit:final` require exact versioned bundle/installer identity).
4. UI proof is stronger than prior lines and now executes selected state helper behavior.
5. Release discipline remains deterministic through clean-worktree proofs and merge-commit traceability.

## What Is Still Weak

1. Top-level governance narrative is now behind shipped state:
   - `README.md` still presents `v1.5.3` as current stable.
   - `docs/PROJECT_STATUS.md` still presents `1.5.3` current and `v1.5.4-hardening` as active.
   - `docs/agent/MASTER_OVERVIEW.md` and `docs/dev/WORKTREE_SETUP_NOTES.md` still anchor to `v1.5.3`.
2. WARN profile remains default for non-strict invocations (`warn` + `internal`) and depends on operator discipline for strict stable signoff use.
3. `verify:ui` still derives proofs from source-level runtime helper execution, not full interactive browser-flow execution.

## Acceptable Debt

1. WARN profile can remain available for internal maintenance checks if stable-tag signoff continues to require strict profile.
2. Build-first verification flow is acceptable as long as preconditions and remediation stay explicit.
3. Non-blocking install/runtime warning noise remains acceptable with updated inventory and disposition.

## Real Release-Risk Items

1. Governance drift after each ship weakens trust in top-level project truth, even when release proofs are correct.
2. WARN default remains vulnerable to careless interpretation in teams that skip strict stable signoff reruns.
3. Static-heavy UI proof strategy can still miss regressions in interaction choreography.

## Proof Surface Assessment

| Surface | Current Strength | Notes |
|---|---|---|
| Stable gate order / clean-worktree proof | Strong | Repeated and consistent in `v1.5.x` |
| Version-pinned artifact proof | Strong | Wrong-version/stale artifacts are rejected |
| WARN/strict audit interpretation | Medium-Strong | Explicitly improved in `v1.5.4`; still default-permissive outside strict mode |
| UI runtime-proof depth | Medium | Better than prior lines; still not full interaction execution |
| Governance/status narrative cohesion | Medium-Weak | Top-level docs lag `v1.5.4` shipped truth |

## Audit Conclusion

`v1.5.4` is a legitimate stable release with clean proof integrity.  
Evidence is still mixed for immediate expansion because trust-layer governance truth drift and remaining proof-policy depth gaps are still active.
