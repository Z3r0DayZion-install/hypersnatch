# Worktree Setup Notes

This note documents the expected setup flow for clean throwaway worktrees used for gate proof.

Current stable shipped line: `v1.5.7`  
Current hardening line: `release-readiness/v1.5.8-hardening`

## Required Steps

1. Create or switch to a clean worktree at the target branch/commit.
2. Run `npm install` in that worktree before any gate commands.
3. Confirm `git status --short` is clean before running proof gates.
4. Run gates in the standard order listed below.

## Common Pitfalls

- Running gates before `npm install` can fail because local runtime/build modules are missing.
- Using a dirty primary worktree can contaminate proof with unrelated changes.
- Running release packaging from a non-merged branch can break artifact-to-history trust.

## Builder and Runtime Gotchas

- `npm run verify` and `npm run build:wrapper` depend on local build/runtime dependencies.
- `npm run verify` requires build artifacts in `dist`; run `npm run build:wrapper` first in clean proof flows.
- Missing `electron-builder/dist` or related packaging dependencies will cause build/verify failures.
- If builder artifacts are stale, rerun `npm install` and rerun the full gate set.
- Node runtime baseline is defined in `package.json` (`engines.node = 20.17.0`) as the minimum supported Node 20 proof runtime.
- `scripts/verify_release.js` now fails with explicit remediation when runtime/dependency prerequisites are missing.
- Strict stable signoff expects explicit strict artifacts in `dist`: installer, versioned release bundle, `hypersnatch-cli.exe`, and `SHA256SUMS.txt`.

## Dependency Hygiene Baseline

- Install command for clean worktrees: `npm install`
- Required local tooling for release proof:
  - `electron`
  - `electron-builder`
- Determinism surfaces:
  - `package-lock.json` present and committed
  - Node runtime matches `package.json` engine policy
- Warning inventory process:
  1. Run `npm install` in a clean worktree.
  2. Capture any warnings in the latest versioned `docs/dev/DEPENDENCY_WARNING_INVENTORY_*.md` (current baseline: `docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.7.md`).
  3. Classify each warning as `informational`, `medium risk`, or `action required`.
  4. Record whether it is observation-only or requires a maintenance action.

## Expected Gate Order

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`
7. `npm run audit:stable` (required for strict stable signoff)

## Signoff Workflow

1. `npm run audit:final` is maintenance evidence and must show non-signoff context for stable-tag decisions.
2. `npm run audit:stable` is the strict stable signoff command.
3. Stable tags/releases are blocked unless strict signoff reports `SIGNOFF STATUS: APPROVED`.

## Proof Discipline

- Record gate outputs on the exact commit being reviewed.
- Keep proof commands and release/tag actions in the same clean worktree context.
- Do not claim readiness if any gate is skipped or red.
