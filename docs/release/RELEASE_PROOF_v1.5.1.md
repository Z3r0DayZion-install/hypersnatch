# HyperSnatch Release Proof v1.5.1

Date sealed: 2026-03-20

## Locked Release Record

- Stable release: `v1.5.1`
- Hardening merge commit: `c139e1ff96d9053ed4b18caae848e2225bbefa07`
- Identity merge commit: `3bbcb44586fff053a9b0c392c4a6ff5118a6cc48`
- Tag: `v1.5.1`
- Tag object SHA: `3e058b7c4798385d8612d159524e0d5bf8cc7d5f`
- Release commit SHA: `3bbcb44586fff053a9b0c392c4a6ff5118a6cc48`
- Artifact: `HyperSnatch_Vanguard_v1.5.1.zip`
- Artifact SHA256: `5a7c8e7aab14894cbf21683c952ff8ff3f2545c81775d61a7420e3e156afc2e5`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.5.1`

## Clean Merged-Main Proof

Proof ran from a clean throwaway worktree anchored to merged `origin/main` at `3bbcb44586fff053a9b0c392c4a6ff5118a6cc48`.

Gate order and results:

1. `npm install` PASS
2. `npm test` PASS
3. `npm run verify:ui` PASS
4. `npm run build:wrapper` PASS
5. `npm run verify` PASS
6. `npm run audit:final` PASS

Identity checks:

- `package.json` = `1.5.1`
- `VERSION.json` = `1.5.1`
- artifact name = `HyperSnatch_Vanguard_v1.5.1.zip`
- `git status --short` clean in proof worktree

## Audit Policy Note

`audit:final` passed with explicit WARN-mode policy for optional CLI/hash strictness in default profile.

Optional strict mode:

- `HYPERSNATCH_AUDIT_REQUIRE_HASH=1`
- `HYPERSNATCH_AUDIT_REQUIRE_CLI=1`

