# HyperSnatch Release Proof v1.5.6

Date: 2026-03-21  
Release line: stable

## Locked Release Record

- Stable release: `v1.5.6`
- Hardening merge commit: `7044742e5fe1751d93d708fe9e6a901ea6c62125`
- Identity merge commit: `91dcb67d5d49c11aaa8c9aacef1cec86ec236d76`
- Tag: `v1.5.6`
- Tag object SHA: `0fac3cf8b749bc1e541ed0a06d2e68872a878d96`
- Peeled commit SHA: `91dcb67d5d49c11aaa8c9aacef1cec86ec236d76`
- Artifact: `HyperSnatch_Vanguard_v1.5.6.zip`
- Artifact SHA256: `802087265fd617cb75524834e28502e85fc303a429c7491ffa3d6178003187bf`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.5.6`

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

- `package.json` = `1.5.6`
- `VERSION.json` = `1.5.6`
- built artifact name = `HyperSnatch_Vanguard_v1.5.6.zip`
- `git status --short` clean in proof worktree

## Audit Profile Note

`audit:final` in warn/internal mode prints explicit non-signoff guidance and strict stable rerun contract.  
Strict stable signoff mode:

- `HYPERSNATCH_AUDIT_PROFILE=strict`
- `HYPERSNATCH_AUDIT_RELEASE_TYPE=stable`

This policy remained intentional during `v1.5.6` release proof.
