# HyperSnatch Release Proof v1.5.3

Date: 2026-03-20  
Release line: stable

## Locked Release Record

- Stable release: `v1.5.3`
- Hardening merge commit: `933451c6bc45142f9a8be4230815ece3a9bb5326`
- Identity merge commit: `1d4767a222831286501fa2626dc62583a1788132`
- Tag: `v1.5.3`
- Tag object SHA: `614811183729d327e975ae0f6f1ebce79a39c3d7`
- Peeled commit SHA: `1d4767a222831286501fa2626dc62583a1788132`
- Artifact: `HyperSnatch_Vanguard_v1.5.3.zip`
- Artifact SHA256: `01fe1f52ee99556ced3b698de8fec4fb93556b8725184b1632642e31c1336f5c`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.5.3`

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

- `package.json` = `1.5.3`
- `VERSION.json` = `1.5.3`
- built artifact name = `HyperSnatch_Vanguard_v1.5.3.zip`
- `git status --short` clean in proof worktree

## Audit Profile Note

`audit:final` is configured to PASS with explicit WARN lines when optional CLI/hash strictness is disabled.  
Strict mode can be enforced via:

- `HYPERSNATCH_AUDIT_REQUIRE_HASH=1`
- `HYPERSNATCH_AUDIT_REQUIRE_CLI=1`

This behavior remains intentional under the `v1.5.3` hardening policy.
