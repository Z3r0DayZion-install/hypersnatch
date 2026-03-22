# Worktree Setup Notes

This note defines the operational setup flow for clean throwaway worktrees used for release-readiness proof.

Current stable shipped line: `v1.5.9`  
Current hardening line: `release-readiness/v1.5.10-hardening`

Canonical setup truth docs:

- `docs/release/V1_5_10_SETUP_TRUTH_MATRIX.md`
- `docs/release/V1_5_10_ENVIRONMENT_ASSUMPTIONS.md`
- `docs/release/V1_5_10_CLAIM_TO_PROOF_MAP.md`
- `docs/release/V1_5_10_GOVERNANCE_GAPS.md`

## Required Steps

1. Create or switch to a clean worktree at the target branch/commit.
2. Run `npm install` in that worktree before any gate commands.
3. Confirm `git status --short` is clean before running proof gates.
4. Run gates in the standard order listed below.

## Required vs Optional Setup

Required for release-readiness proof:

- Node runtime at or above `package.json` baseline (`engines.node = 20.17.0` on Node 20 line)
- `npm install` completed in the same worktree used for proof
- clean `dist` artifact state for version-exact proof
- strict stable signoff artifacts in `dist`:
  - `HyperSnatch-Setup-<version>.exe`
  - `HyperSnatch_Vanguard_v<version>.zip`
  - `SHA256SUMS.txt`

Optional/conditional:

- `hypersnatch-cli.exe` is optional by default; enforce only with `HYPERSNATCH_AUDIT_REQUIRE_CLI=1`
- Windows code-signing (`HYPERSNATCH_SIGN=1`) is contract-dependent and requires cert/signtool setup

## Common Pitfalls

- Running gates before `npm install` can fail because runtime/build modules are missing.
- Using a dirty primary worktree can contaminate proof with unrelated changes.
- Running release packaging from a non-merged branch can break artifact-to-history trust.
- Mixed-version artifacts in `dist` cause deterministic verification failures by design.

## Native vs Simulated/Test-Context Caveats

- `npm run verify:ui` is a source/harness runtime proof, not packaged interaction E2E.
- `npm run verify` validates packaged `app.asar` runtime markers, but still at marker-level depth.
- `npm run audit:final` is maintenance evidence only (`NON-SIGNOFF`), not stable tag approval.
- `npm run audit:stable` is the strict stable signoff command and must show `SIGNOFF STATUS: APPROVED` for stable release/tag actions.

## Dependency Hygiene Baseline

- Install command for clean worktrees: `npm install`
- Required local tooling for release proof:
  - `electron`
  - `electron-builder`
- Determinism surfaces:
  - `package-lock.json` present and committed
  - Node runtime matches `package.json` engine policy
- Baseline inventory lag is currently tracked as an explicit governance gap in `docs/release/V1_5_10_GOVERNANCE_GAPS.md`.

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
