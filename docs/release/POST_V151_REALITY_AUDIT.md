# Post-v1.5.1 Reality Audit

Date: 2026-03-20  
Branch: `post-release/v1.5.1-reality-audit`  
Baseline: `origin/main` at `3bbcb44586fff053a9b0c392c4a6ff5118a6cc48`

## Locked Release Facts

- Stable release: `v1.5.1`
- Hardening merge: `c139e1ff96d9053ed4b18caae848e2225bbefa07`
- Identity merge: `3bbcb44586fff053a9b0c392c4a6ff5118a6cc48`
- Tag object: `3e058b7c4798385d8612d159524e0d5bf8cc7d5f`
- Artifact: `HyperSnatch_Vanguard_v1.5.1.zip`
- SHA256: `5a7c8e7aab14894cbf21683c952ff8ff3f2545c81775d61a7420e3e156afc2e5`

## Stable-Order Evidence

Clean merged-main proof sequence:

- `npm install` PASS
- `npm test` PASS
- `npm run verify:ui` PASS
- `npm run build:wrapper` PASS
- `npm run verify` PASS
- `npm run audit:final` PASS (`PASS WITH WARNINGS: 2` by explicit policy)

Identity truth on merged main:

- `package.json`: `1.5.1`
- `VERSION.json`: `1.5.1`
- Built artifact: `dist/HyperSnatch_Vanguard_v1.5.1.zip`
- Clean worktree during proof

## What Is Objectively Strong

1. Stable-order proof discipline is real and reproducible from clean worktrees.
2. Release identity surfaces are aligned (`package`, `lock`, `VERSION`, UI fallback, artifact naming).
3. `verify` preflight now gives explicit dependency/runtime remediation.
4. `audit:final` now uses explicit PASS/WARN/FAIL semantics instead of ambiguous skip phrasing.
5. `verify:ui` is significantly deeper than baseline shell checks and covers major queue/case/report/lineage hooks.

## What Is Still Weak

1. `audit:final` default WARN profile (`requireHash=no`, `requireCli=no`) is acceptable but still soft for strict release claims unless policy is explicitly pinned for stable runs.
2. Artifact selection in `verify`/`audit:final` is not version-pinned to `package.json`; a dirty `dist` containing multiple setup exes can pass against the wrong installer.
3. `verify:ui` remains static/source-hook heavy; it does not execute live interaction flows end-to-end, so behavioral regressions can still hide behind presence checks.
4. Post-ship status narrative is stale in current docs (`docs/PROJECT_STATUS.md` still frames `1.5.1` as in-progress), weakening release-story trust.

## Acceptable Debt

1. Optional CLI/hash strictness can remain WARN-mode if stable release policy documents it as intentional and bounded.
2. Transitive dependency deprecation warnings are observation-level unless they impact gate reliability or introduce active security exposure.
3. Rust `dead_code` warning noise is non-blocking for release integrity.

## Real Release-Risk Items

1. Version-agnostic installer discovery can produce false-confidence verification in contaminated worktrees.
2. WARN-mode audit can be operationally ignored without a stable-profile contract, reducing proof strictness over time.
3. UI proof depth still leaves runtime state transition truth partially unverified under real interaction.

## Proof Surface Assessment

| Surface | Current Strength | Notes |
|---|---|---|
| Stable gate order and clean-worktree flow | Strong | Deterministic and repeated successfully |
| Version/artifact identity alignment | Strong | `1.5.1` alignment is complete |
| Verify/build dependency truth | Medium-Strong | Explicit preflight exists; runtime policy is clearer |
| Final audit coverage strictness | Medium | Warn profile is explicit, but still policy-soft by default |
| UI workflow proof depth | Medium | Broad hook coverage, limited runtime execution |
| Post-release narrative cohesion | Medium-Weak | Status docs still lag locked release truth |

## Audit Conclusion

`v1.5.1` is legitimately shipped and stable.  
Evidence is not fully clean enough for immediate expansion without another tightening pass on proof strictness and verification trust boundaries.

