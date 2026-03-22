# v1.5.10 Clean Environment Install Proof

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`  
Worktree path: `C:\Users\KickA\HyperSnatch_v1_5_9_release_proof_post_identity`

This document records clean-install evidence used for dependency-baseline claims.

## Command Path Used

1. `git status --short` (clean check)
2. `node -v`
3. `npm -v`
4. `npm install`
5. `npm ls --depth=0 --json`

## Observed Output Summary

1. `git status --short`: clean before capture.
2. Node runtime: `v20.17.0`.
3. npm runtime: `10.8.2`.
4. `npm install`: PASS, with `postinstall` hook (`npx --yes electron-builder install-app-deps`) and no install warnings in this run.
5. `npm ls --depth=0 --json`: top-level installed versions match declared baseline expectations.

## Reproducibility Surfaces

Direct proof:

1. `package-lock.json` exists and is committed.
2. Install completed successfully on clean worktree.
3. Top-level installed dependency versions are explicitly captured.

Inferred:

1. Equivalent warning-free installs on all operator machines.
2. Equivalent install behavior under different Node/npm combinations.

## Claim Boundary

Allowed:

- "clean install proof passed in documented environment with lockfile discipline."

Not allowed:

- "clean install is guaranteed on every environment without caveats."
