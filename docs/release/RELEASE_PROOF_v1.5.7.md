# HyperSnatch Release Proof v1.5.7

Date: 2026-03-21  
Release line: stable

## Locked Release Record

- Stable release: `v1.5.7`
- Hardening merge commit: `f1b46804f942d1be0cb1a88d122e0ee6894e4589`
- Identity merge commit: `6911813a550fa4a44eb3dbc09f744427e0279819`
- Tag: `v1.5.7`
- Tag object SHA: `cc5206a7f5e0b87df938da547bc94ea51857b02f`
- Peeled commit SHA: `6911813a550fa4a44eb3dbc09f744427e0279819`
- Artifact: `HyperSnatch_Vanguard_v1.5.7.zip`
- Artifact SHA256: `94cd66ac3682083ea1929542bb1a66ef32f3e90fb70322cabb3767c622a4b702`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.5.7`

## Proof Method

Proof was run from a clean throwaway worktree at merged `origin/main` after the identity PR merged.

## Gate Sequence and Result

1. `npm install` - PASS
2. `npm test` - PASS
3. `npm run verify:ui` - PASS
4. `npm run build:wrapper` - PASS
5. `npm run verify` - PASS
6. `npm run audit:final` - PASS (explicit WARN profile)

## Identity Truth

- `package.json` = `1.5.7`
- `VERSION.json` = `1.5.7`
- built artifact name = `HyperSnatch_Vanguard_v1.5.7.zip`
- `git status --short` clean in proof worktree

## Audit Profile Note

`audit:final` in warn/internal mode prints explicit non-signoff guidance and strict stable rerun contract.  
Strict stable signoff mode:

- `HYPERSNATCH_AUDIT_PROFILE=strict`
- `HYPERSNATCH_AUDIT_RELEASE_TYPE=stable`

This policy remained intentional during `v1.5.7` release proof.
