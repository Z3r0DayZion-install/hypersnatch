# v1.5.10 Environment Assumptions

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This doc defines what the repo currently assumes for release-readiness proof reproduction.

## OS Assumptions

| Surface | Assumption | Why |
|---|---|---|
| Stable release packaging path | Windows environment | current wrapper flow uses NSIS artifacts and PowerShell `Compress-Archive` |
| Shell examples | PowerShell | setup/release docs and wrapper scripts are written around PowerShell commands |
| Cross-platform behavior | Not guaranteed for release packaging parity | release proof and artifact naming are currently validated in Windows-oriented flow |

## Node/npm Assumptions

| Surface | Assumption | Why |
|---|---|---|
| Node baseline | Node 20 line with minimum `20.17.0` | enforced by `package.json` engine policy and `npm run verify` checks |
| npm install behavior | install succeeds in clean worktree | test/build/verify/audit all depend on local install state |
| Lockfile discipline | `package-lock.json` is present and committed | deterministic dependency expectation |

## Shell/Command Assumptions

| Surface | Assumption | Why |
|---|---|---|
| Gate order execution | commands run exactly in documented order | signoff/release claims assume this sequence |
| Audit interpretation | `audit:final` is non-signoff; `audit:stable` is strict signoff | avoids false approval claims |
| Artifact root | `dist/` contains current-version artifacts only | strict signoff fails mixed/stale outputs by design |

## Install/Build/Test Assumptions

1. `npm install` runs before test/build/verify/audit commands.
2. `npm run build:wrapper` runs before `npm run verify` and strict signoff.
3. `npm run verify` may fail if packaged artifacts are missing or stale.
4. `npm run audit:stable` assumes strict hash-manifest availability (`SHA256SUMS.txt`).
5. Clean worktree discipline is part of proof validity, not optional hygiene.

## Simulated/Test-Context Assumptions

1. `verify:ui` includes runtime-harness semantics from source HTML and embedded functions.
2. Packaged runtime truth in `verify` is marker-based (`app.asar`) and not full packaged interaction E2E.
3. Any claim stronger than these proof surfaces must be downgraded unless new direct proof exists.

## What Is Explicitly Not Guaranteed

1. Full packaged interaction E2E proof for every operator flow (still partially indirect).
2. Universal cross-platform packaging parity across non-Windows environments.
3. External trust-store acceptance of binaries unless signing evidence is explicitly provided.
4. Warning-free dependency installs across all machines and dates (baseline updates are versioned evidence snapshots).
5. Reproducibility from dirty worktrees or from reordered/skipped gate commands.
