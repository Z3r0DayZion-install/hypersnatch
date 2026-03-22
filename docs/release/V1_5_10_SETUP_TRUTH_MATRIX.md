# v1.5.10 Setup Truth Matrix

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This file is the canonical setup-truth reference for the `v1.5.10` hardening line.

## Required/Optional Dependency and Environment Matrix

| Surface | Level | Truth | How It Is Proven | Caveat |
|---|---|---|---|---|
| Node runtime | Required | Release-readiness proof expects Node 20 with minimum `20.17.0` from `package.json` | `npm run verify` checks runtime vs `engines.node` | This is a proof baseline, not a claim of all Node versions |
| npm dependency install | Required | `npm install` must run in the exact worktree used for proof | install command success + gate sequence execution | Network/package-registry availability is an external dependency |
| `electron` + `electron-builder` toolchain | Required for build/signoff proof | Build/signoff proofs depend on local builder/runtime dependencies | `npm run build:wrapper` + `npm run verify` + `npm run audit:stable` | Missing deps are expected hard failures, not soft warnings |
| Dependency warning baseline | Required for governance truth claims | Latest install-warning baseline must be versioned to shipped line | `docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.9.md` + slice-2 dependency packet | Baseline is evidence for current line, not a perpetual guarantee |
| Clean worktree | Required | Proof and release tagging require a clean worktree | `git status --short` is empty before/after gates | Dirty worktrees are not supported for release proof |
| Strict stable artifacts | Required for strict signoff | `dist` must contain version-matched installer, versioned zip, and `SHA256SUMS.txt` | `npm run audit:stable` strict checks | Mixed/stale artifacts intentionally fail |
| CLI artifact (`hypersnatch-cli.exe`) | Optional by default | CLI artifact is not required unless explicitly requested | `HYPERSNATCH_AUDIT_REQUIRE_CLI=1` enables requirement | Do not claim CLI as required unless this flag is part of contract |
| Windows code signing (`signtool` + cert) | Optional/contract-dependent | Signing is only required when release contract explicitly requires signed binaries | `HYPERSNATCH_SIGN=1` flow + signing env vars | Default strict signoff validates artifact/hash contract, not external trust authority |
| PowerShell `Compress-Archive` | Required for current wrapper packaging flow | `scripts/build_release_pack.js` shells out to PowerShell zip path | `npm run build:wrapper` | Current release-pack path is Windows/PowerShell-biased |

## Native vs Simulated/Test-Context Conditions

| Proof Surface | Condition Type | Truth |
|---|---|---|
| `npm run verify` packaged marker checks (`app.asar`) | Native packaged artifact check | Directly proves marker presence in packaged artifacts, not full interaction E2E |
| `npm run verify:ui` | Simulated/test-context runtime harness | Strong source/runtime semantics coverage; still not packaged interaction E2E |
| `npm run audit:final` | Non-signoff maintenance context | Must be interpreted as maintenance evidence only (`NON-SIGNOFF`) |
| `npm run audit:stable` | Strict signoff context | Required stable-tag approval surface (`SIGNOFF STATUS: APPROVED`) |

## Local-Only Assumptions

1. Proof commands are executed in the same local clean worktree used for release decisions.
2. `dist/` artifact state belongs to the current commit/version and is not mixed with stale outputs.
3. Local filesystem allows writing `dist/` and reading release docs/scripts.
4. Operator uses documented command order; skipped/reordered gates invalidate release-readiness claims.

## Signing and Trust Caveats

1. Stable signoff (`audit:stable`) confirms strict artifact/hash/signoff contract for the current policy.
2. Stable signoff does not by itself prove external OS trust UI behavior or third-party trust-store acceptance.
3. Unsigned/test-context builds must not be described as externally trusted binaries.
4. Any stronger trust claim must cite explicit signing evidence for that release.

## Clean Operator Machine Expectation

A clean operator machine for release-readiness proof is expected to have:

1. Windows environment with PowerShell available for current wrapper packaging flow.
2. Node/npm meeting the policy baseline (`engines.node = 20.17.0` minimum on Node 20 line).
3. Ability to run `npm install`, test/build scripts, and write to `dist/`.
4. No pre-existing stale/mixed release artifacts in the proof worktree.
5. Ability to run the required gate order exactly:
   1. `npm install`
   2. `npm test`
   3. `npm run verify:ui`
   4. `npm run build:wrapper`
   5. `npm run verify`
   6. `npm run audit:final`
   7. `npm run audit:stable`
