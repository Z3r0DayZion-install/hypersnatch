# HyperSnatch Release Proof v1.5.8

Date: 2026-03-21  
Release line: stable

## Locked Release Record

- Stable release: `v1.5.8`
- Hardening merge commit: `660cc12665733590d30480e4cb167454deef1f18`
- Identity merge commit: `bf6e5f7a4b8aa959e7e355dcefceb4346cd3671f`
- Tag: `v1.5.8`
- Tag object SHA: `e00069cf153302a9d897aef784c43562af502db8`
- Peeled commit SHA: `bf6e5f7a4b8aa959e7e355dcefceb4346cd3671f`
- Artifact: `HyperSnatch_Vanguard_v1.5.8.zip`
- Artifact SHA256: `c254a5f8985902d66be51798bc657b50bcb1b425d6f943bddfce173bbc5f80fa`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.5.8`

## Proof Method

Proof was run from a clean throwaway worktree at merged `origin/main` after the identity PR merged.

## Gate Sequence and Result

1. `npm install` - PASS
2. `npm test` - PASS
3. `npm run verify:ui` - PASS
4. `npm run build:wrapper` - PASS
5. `npm run verify` - PASS
6. `npm run audit:final` - PASS (explicit non-signoff output)
7. `npm run audit:stable` - PASS (`SIGNOFF STATUS: APPROVED`)

## Identity Truth

- `package.json` = `1.5.8`
- `VERSION.json` = `1.5.8`
- built artifact name = `HyperSnatch_Vanguard_v1.5.8.zip`
- `git status --short` clean in proof worktree

## Audit Profile Note

`audit:final` remains maintenance/non-signoff evidence.  
`audit:stable` is the strict stable signoff path and approved in this release proof.
