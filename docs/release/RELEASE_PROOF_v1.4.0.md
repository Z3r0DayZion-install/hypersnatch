# Release Proof v1.4.0

Date: 2026-03-19
Release line: `v1.4.0` (stable)

## Locked Release Identity

- Merge commit: `98e9e3accc6fd98beedf24aed2ea8ae0bacee210`
- Tag: `v1.4.0`
- Tag object SHA: `996f6877f538a08f36c8f1caf63f7e18cbc20480`
- Peeled tag commit SHA: `98e9e3accc6fd98beedf24aed2ea8ae0bacee210`

## Published Artifact

- Filename: `HyperSnatch_Vanguard_v1.4.0.zip`
- SHA256: `eafbeab843b9f04ac6a59cd78b6e8f2b2c75ba664d219d1b22c5f56f8051bd1d`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.4.0`
- Asset URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/download/v1.4.0/HyperSnatch_Vanguard_v1.4.0.zip`

## Clean Merged-Main Proof Context

- Proof worktree: `C:\Users\KickA\HyperSnatch_v1_4_0_stable_proof`
- Proof source: merged `origin/main` at `98e9e3accc6fd98beedf24aed2ea8ae0bacee210`
- Version truth:
  - `package.json` = `1.4.0`
  - `VERSION.json` = `1.4.0`
- Working tree state in proof worktree: clean

## Gate Results (Merged Main)

- `npm test` PASS
- `npm run verify:ui` PASS
- `npm run verify` PASS
- `npm run build:wrapper` PASS
- `npm run audit:final` PASS

## Engine Policy Statement

Stable `v1.4.0` was released with explicit runtime policy:

- Node baseline kept at `20.17.0`
- dependency drift resolved by pinning `jsdom` to `26.1.0`
- no unresolved engine-policy ambiguity carried into stable

## Lineage

- Prior stable recovery baseline: `v1.3.1`
- Forensic baseline reference: `audit/snapshot-2026-03-19-head`
- Prerelease checkpoints retained: `v1.4.0-alpha.1`, `v1.4.0-beta.1`
