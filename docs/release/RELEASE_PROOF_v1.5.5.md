# HyperSnatch Release Proof v1.5.5

Date: 2026-03-20  
Release line: stable

## Locked Release Record

- Stable release: `v1.5.5`
- Hardening merge commit: `1d3dc68499a2d5b09a2d28f51d6aaa940517236a`
- Identity merge commit: `e61e559be38e4354888f2a0abe764d0f0ea89e87`
- Tag: `v1.5.5`
- Tag object SHA: `00bdb601cb84b538671d3af470ab20c2ed40dbeb`
- Peeled commit SHA: `e61e559be38e4354888f2a0abe764d0f0ea89e87`
- Artifact: `HyperSnatch_Vanguard_v1.5.5.zip`
- Artifact SHA256: `e023abd299eadaa5fcf4c9feadd81725d9921527b49dea55acc2e55d9027ccce`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.5.5`

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

- `package.json` = `1.5.5`
- `VERSION.json` = `1.5.5`
- built artifact name = `HyperSnatch_Vanguard_v1.5.5.zip`
- `git status --short` clean in proof worktree

## Audit Profile Note

`audit:final` in warn/internal mode prints explicit non-signoff guidance and strict stable rerun contract.  
Strict stable signoff mode:

- `HYPERSNATCH_AUDIT_PROFILE=strict`
- `HYPERSNATCH_AUDIT_RELEASE_TYPE=stable`

This policy remained intentional during `v1.5.5` release proof.
