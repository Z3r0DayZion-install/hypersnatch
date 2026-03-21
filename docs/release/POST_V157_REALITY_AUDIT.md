# Post-v1.5.7 Reality Audit

Date: 2026-03-21  
Branch: `post-release/v1.5.7-reality-audit`  
Release under audit: `v1.5.7`

## Locked Release Record

- Hardening merge: `f1b46804f942d1be0cb1a88d122e0ee6894e4589`
- Identity merge: `6911813a550fa4a44eb3dbc09f744427e0279819`
- Proof-doc merge: `c11db2b22ff6b7891a8fe4304ef1be58001ab250`
- Tag: `v1.5.7`
- Tag object: `cc5206a7f5e0b87df938da547bc94ea51857b02f`
- Artifact: `HyperSnatch_Vanguard_v1.5.7.zip`
- Artifact SHA256: `94cd66ac3682083ea1929542bb1a66ef32f3e90fb70322cabb3767c622a4b702`

## Stable-Order Gate Truth

From `docs/release/RELEASE_PROOF_v1.5.7.md` (clean merged-main proof):

1. `npm install` - PASS
2. `npm test` - PASS
3. `npm run verify:ui` - PASS
4. `npm run build:wrapper` - PASS
5. `npm run verify` - PASS
6. `npm run audit:final` - PASS (WARN profile, non-signoff mode)

Post-release spot checks on this audit branch:

- `npm install` - PASS (no install warnings observed)
- `npm test` - PASS
- `npm run verify:ui` - PASS
- `npm run verify` - PASS
- `npm run audit:final` - PASS (WITH WARNINGS: 2, `SIGNOFF STATUS: BLOCKED`)
- `npm run audit:stable` - FAIL (`CLI artifact required but not found`)

## Release Identity and Artifact/Version Proof Truth

- `package.json` version: `1.5.7`
- `VERSION.json` version: `1.5.7`
- `dist/HyperSnatch_Vanguard_v1.5.7.zip` exists locally and hashes to `94cd66ac3682083ea1929542bb1a66ef32f3e90fb70322cabb3767c622a4b702` (matches locked release record)
- `scripts/verify_release.js` enforces:
  - exact installer name for current package version
  - exact versioned Vanguard bundle name
  - stale/mixed/ambiguous installer and bundle rejection
  - lockfile/runtime/dependency preflight

## Verify/Build Dependency Truth

Strong:

- `verify` enforces lockfile presence, Node engine floor, and required build dependencies (`electron`, `electron-builder`).
- Missing `dist` and missing deps fail with explicit remediation.

Still soft:

- `docs/dev/DEPENDENCY_WARNING_INVENTORY_*` stops at `v1.5.5`; there is no `v1.5.6` or `v1.5.7` inventory record.
- `docs/release/CLEAN_WORKTREE_RELEASE_FLOW.md` gate ordering is stale relative to current hardening flow (lists `verify` before `build:wrapper`, and omits current canonical order from `docs/dev/WORKTREE_SETUP_NOTES.md`).

## WARN/Signoff Guidance Behavior

Strong:

- `tests/final_sovereign_audit.js` now prints explicit signoff state (`SIGNOFF STATUS: BLOCKED` vs `APPROVED`).
- WARN/default runs explicitly declare non-signoff status and point to strict rerun command (`npm run audit:stable`).

Still soft (material):

- Strict stable signoff currently requires CLI artifact + `SHA256SUMS.txt`.
- Current `v1.5.7` dist profile does not include `hypersnatch-cli.exe` or `SHA256SUMS.txt`.
- Result: strict path (`npm run audit:stable`) fails in current artifact profile; practical release proof still leans on WARN-mode `audit:final` evidence.

## Permanent Proof-Record Status

- Permanent proof record exists: `docs/release/RELEASE_PROOF_v1.5.7.md`.
- Proof-doc merge is in mainline history: `c11db2b22ff6b7891a8fe4304ef1be58001ab250`.

## What Is Objectively Strong

1. Release identity chain is locked and reproducible (merge commits, tag object, artifact hash).
2. Artifact/version pinning and stale-artifact rejection are strong in both verify and audit surfaces.
3. UI proof gate is materially deeper than early `1.5.x` (queue, reopenability, rollups, report/export/timeline semantics).
4. Release proof discipline and immutable recordkeeping are intact.

## What Is Still Weak

1. Strict stable signoff path is not aligned to default artifact output profile (`audit:stable` fails in current dist state).
2. Governance/status/setup surfaces still lag shipped truth (`README.md`, `docs/PROJECT_STATUS.md`, `docs/agent/MASTER_OVERVIEW.md`, `docs/dev/WORKTREE_SETUP_NOTES.md` still present `v1.5.6` as current stable and `v1.5.7` as active hardening line).
3. Some setup/governance process docs are drifted (`CLEAN_WORKTREE_RELEASE_FLOW.md` ordering mismatch; dependency warning inventory not rolled forward).
4. `verify:ui` is deep but still renderer-function runtime proof from static HTML + VM extraction, not full packaged Electron interaction proof.

## Acceptable Debt

1. WARN profile as maintenance evidence mode is acceptable when strict signoff path is explicitly blocked and separately required.
2. Minor report/readability polish for large datasets can remain expansion/backlog scope.

## Real Release Risk

1. Signoff assurance gap: strict stable signoff contract exists, but current artifact profile cannot satisfy it without additional release-surface tightening.
2. Governance truth lag: top-level status/setup docs currently understate shipped release state (`v1.5.7`), increasing onboarding/review error risk.
3. Setup/process drift: conflicting gate-order documentation and stale dependency warning inventory increase manual guesswork risk.
4. Runtime-proof confidence is improved but not yet full end-to-end for operator-critical flows.

## Proof Surface Assessment

| Surface | Strength | Notes |
|---|---|---|
| Stable-order gate history | Strong | `RELEASE_PROOF_v1.5.7.md` shows clean ordered PASS chain |
| Release identity truth | Strong | merge/tag/tag-object/artifact hash all lock cleanly |
| Artifact/version pinning | Strong | strict expected-name and stale/mixed rejection in verify + audit |
| WARN guidance clarity | Medium-Strong | wording is explicit, but strict mode practical path currently fails |
| Strict stable signoff execution | Soft | `audit:stable` fails due missing CLI/hash artifacts in current dist profile |
| UI runtime proof depth | Medium | much deeper semantics, still not packaged-Electron end-to-end |
| Governance/status/setup narrative | Soft | top-level docs lag shipped `v1.5.7` truth |
| Dependency/setup confidence docs | Medium-Soft | current install is clean, but warning inventory/process docs are stale |

## Reality Verdict

`v1.5.7` is a real shipped release with strong identity/proof discipline.  
The remaining debt is still trust/proof/governance tightening debt, not expansion-capability debt.
