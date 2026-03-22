# v1.5.10 Claim-to-Proof Map

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This map is the release-facing summary.  
For operational detail and upgrade paths, see:

- `docs/release/V1_5_10_DIRECT_PROOF_REGISTER.md`
- `docs/release/V1_5_10_PACKAGED_INTERACTION_PROOF.md`
- `docs/release/V1_5_10_PROOF_DEPTH_GAPS.md`
- `docs/release/V1_5_10_SIGNOFF_LANGUAGE_NORMALIZATION.md`

## Release-Critical Claims

| Claim ID | Claim | Current Proof Type | Direct vs Indirect | Primary Evidence Surface | Conservative Allowed Wording | Upgrade Path (if indirect) |
|---|---|---|---|---|---|---|
| C-01 | Version identity is aligned for release commit | Artifact + command output | Direct | `package.json`, `VERSION.json`, versioned dist artifact names | "version identity is aligned on this commit/worktree" | n/a |
| C-02 | Strict stable signoff is approved | Command output token | Direct | `npm run audit:stable` -> `SIGNOFF STATUS: APPROVED` | "strict stable signoff approved for this run" | n/a |
| C-03 | `audit:final` is not stable signoff approval | Command output token | Direct | `npm run audit:final` -> `SIGNOFF STATUS: NON-SIGNOFF` | "`audit:final` is maintenance evidence only" | n/a |
| C-04 | Installer + versioned bundle + hash manifest contract is satisfied | Artifact + command output token | Direct | strict checks in `audit:stable` + `SHA256SUMS.txt` | "strict artifact/hash contract passed" | n/a |
| C-05 | Dist artifact set is version-clean (no mixed stale versions) | Deterministic fail/pass behavior | Direct | `verify` + `audit:stable` stale/mixed artifact guards | "artifact set is clean for this proof run" | n/a |
| C-06 | Packaged runtime bundle includes required operator/runtime markers | Packaged artifact marker scan | Direct (marker-level) | `verify` packaged `app.asar` marker checks | "packaged marker set is present" | add packaged click-path interaction assertions |
| C-07 | Queue/report/reopen/export runtime semantics are verified | Harness/runtime function assertions | Indirect for packaged interaction behavior | `verify:ui` (`ui_smoke_check.js`) runtime assertions | "source/runtime-harness semantics passed; packaged E2E still partial" | execute equivalent assertions in packaged runtime interaction runner |
| C-08 | Core test suite passes for current commit | Command output | Direct | `npm test` | "covered tests passed in this environment" | n/a |
| C-09 | Release-readiness gate sequence is reproducible | Ordered command evidence | Direct (observed environment) | required gate sequence + clean worktree checks | "reproduced in clean worktree using documented order" | optional environment preflight automation |
| C-10 | Dependency baseline evidence is current to shipped line | Versioned documentation + install evidence | Direct (snapshot), indirect for future drift | dependency packet (`V1_5_10_DEPENDENCY_*`) + `DEPENDENCY_WARNING_INVENTORY_v1.5.9.md` | "dependency baseline is current for this release line with explicit risks documented" | refresh baseline each release line and keep risk register current |
| C-11 | Binary trust is externally accepted/signed | Conditional signing evidence | Indirect/conditional | signing artifacts + release note evidence when signing is enabled | "signed trust claim only when signing evidence is explicitly recorded" | define/enforce signing contract in strict release policy |
| C-12 | Governance docs reflect shipped truth and active lane | Documentation evidence | Direct | top-level governance packet | "top-level governance docs aligned to shipped `v1.5.9` and active `v1.5.10` lane" | n/a |

## Language Rules

1. Do not claim full packaged interaction proof when only marker/harness evidence exists.
2. Do not claim trusted/signed binary status without explicit signing evidence.
3. Do not treat `audit:final` as stable signoff approval.
4. Use normalization rules in `V1_5_10_SIGNOFF_LANGUAGE_NORMALIZATION.md`.
