# v1.5.0 Beta Proof Plan

Date: 2026-03-19
Target tag: `v1.5.0-beta.1`
Source branch: `feat/v1.5.0-expansion`

## Policy

- Do not tag from a dirty worktree.
- Do not claim beta readiness from branch-only gates.
- Tag only after clean merged-main proof passes.

## Review and Merge Discipline

1. Keep PR #13 review scoped to workflow truth, trust readability, reporting usefulness, export truthfulness, and UI proof discipline.
2. Merge strategy: merge commit only (no squash).
3. Do not blend unrelated feature families during beta alignment.

## Pre-Merge Branch Gates

Run on `feat/v1.5.0-expansion` before final merge decision:

```bash
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
npm run audit:final
```

## Clean Merged-Main Proof

Run from a clean throwaway worktree anchored to merged `origin/main`:

```bash
git fetch origin
git worktree add ../HyperSnatch_v1_5_0_beta_proof origin/main
cd ../HyperSnatch_v1_5_0_beta_proof

git status
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
npm run audit:final
```

## Beta Truth Checks

```bash
node -p "require('./package.json').version"
type VERSION.json
git status --short
```

Expected:

- `package.json` version: `1.5.0-beta.1`
- `VERSION.json` version: `1.5.0-beta.1`
- clean status (`git status --short` empty)
- artifact: `dist/HyperSnatch_Vanguard_v1.5.0-beta.1.zip`

## Tag Sequence

Tag only after merged-main proof remains green:

```bash
git tag -a v1.5.0-beta.1 -m "HyperSnatch v1.5.0-beta.1"
git push origin v1.5.0-beta.1
```

## Hash Capture

```powershell
certutil -hashfile dist\HyperSnatch_Vanguard_v1.5.0-beta.1.zip SHA256
```

## Prerelease Record

Beta release notes must include:

- merge commit SHA
- tag object SHA
- peeled tag commit SHA
- artifact filename + SHA256
- full clean-worktree gate results
- lawful forensic positioning statement retained
