# HyperSnatch Release Proof v1.5.2

Date: 2026-03-19  
Release line: stable

## Locked Release Record

- Stable release: `v1.5.2`
- Hardening merge commit: `2b475c645e81e511a8b416aecf7f9ba7a8e1a719`
- Identity merge commit: `9d83a50471810259adbe6269d4dac92280c5ee9c`
- Tag: `v1.5.2`
- Tag object SHA: `2c6d5de89a2ce41fe0e80f9494c0c499053ebd54`
- Peeled commit SHA: `9d83a50471810259adbe6269d4dac92280c5ee9c`
- Artifact: `HyperSnatch_Vanguard_v1.5.2.zip`
- Artifact SHA256: `84c0861cc5e493c9ad9aa15e38167a69bbe208ebc8113fb834054fa5245546ea`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.5.2`

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

- `package.json` = `1.5.2`
- `VERSION.json` = `1.5.2`
- built artifact name = `HyperSnatch_Vanguard_v1.5.2.zip`
- `git status --short` clean in proof worktree

## Audit Profile Note

`audit:final` is configured to PASS with explicit WARN lines when optional CLI/hash strictness is disabled.  
Strict mode can be enforced via:

- `HYPERSNATCH_AUDIT_REQUIRE_HASH=1`
- `HYPERSNATCH_AUDIT_REQUIRE_CLI=1`

This behavior is intentional and documented in the `v1.5.2` hardening lane.