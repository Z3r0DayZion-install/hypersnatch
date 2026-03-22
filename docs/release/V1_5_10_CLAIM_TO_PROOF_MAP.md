# v1.5.10 Claim-to-Proof Map

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This map defines which release-critical claims are directly proven vs inferred.

## Release-Critical Claims

| Claim ID | Claim | Proof Surface (Command/Artifact) | Direct vs Indirect | Conservative Allowed Wording |
|---|---|---|---|---|
| C-01 | Version identity is aligned for release commit | `node -p "require('./package.json').version"` + `type VERSION.json` + versioned artifact names in `dist` | Direct | "version identity is aligned on this commit/worktree" |
| C-02 | Strict stable signoff is approved | `npm run audit:stable` output includes `SIGNOFF STATUS: APPROVED` | Direct | "strict stable signoff approved for this run" |
| C-03 | `audit:final` is not a stable signoff approval | `npm run audit:final` output includes `SIGNOFF STATUS: NON-SIGNOFF` | Direct | "`audit:final` is maintenance evidence only" |
| C-04 | Installer + versioned bundle + hash manifest contract is satisfied | `npm run audit:stable` strict checks + `dist/SHA256SUMS.txt` | Direct | "strict artifact/hash contract passed" |
| C-05 | Dist artifact set is version-clean (no mixed stale versions) | `npm run verify` and `npm run audit:stable` fail on mixed-version artifacts | Direct | "artifact set is clean for this proof run" |
| C-06 | Packaged runtime bundle includes required operator/runtime markers | `npm run verify` (`app.asar` marker checks in `scripts/verify_release.js`) | Direct for marker presence | "packaged marker set is present" (not full interaction proof) |
| C-07 | Core queue/report/reopen semantics are checked in runtime harness | `npm run verify:ui` (`scripts/ui_smoke_check.js`) | Indirect for packaged runtime behavior | "source/runtime-harness semantics passed; packaged E2E still partial" |
| C-08 | Core test suite passes for current commit | `npm test` | Direct for covered tests only | "covered tests passed in this environment" |
| C-09 | Release-readiness gate sequence is reproducible in clean worktree | ordered run of required commands + clean `git status --short` | Direct for observed environment | "reproduced in clean worktree using documented order" |
| C-10 | Dependency baseline evidence is current to shipped line | `docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.9.md` + slice-2 dependency packet (`V1_5_10_DEPENDENCY_*`) | Direct for current-line snapshot; indirect for future drift | "dependency baseline is current for this release line with explicit risks documented" |
| C-11 | Binary trust is externally accepted/signed | signing evidence (`HYPERSNATCH_SIGN=1`, signtool/cert artifacts, release notes) | Conditional; not guaranteed by default | "signed trust claim only when signing evidence is explicitly recorded" |
| C-12 | Governance docs reflect shipped truth and active lane | `README.md`, `docs/PROJECT_STATUS.md`, `docs/agent/MASTER_OVERVIEW.md`, `docs/dev/WORKTREE_SETUP_NOTES.md` | Direct | "top-level governance docs aligned to shipped `v1.5.9` and active `v1.5.10` lane" |

## Downgraded Claim Language Rules

1. Do not say "fully verified runtime behavior" when proof is marker/harness based.
2. Do not say "trusted binary" unless signing evidence is explicitly included for the release.
3. Do not say "dependency baseline guaranteed stable" beyond the documented snapshot scope.
4. Do not say "stable signoff approved" from `audit:final`; only `audit:stable` can approve strict signoff.
