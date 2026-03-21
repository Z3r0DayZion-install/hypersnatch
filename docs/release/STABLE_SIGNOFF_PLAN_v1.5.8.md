# Stable Signoff Plan v1.5.8

Date: 2026-03-21  
Branch: `release-readiness/v1.5.8-hardening`

## Goal

Make strict stable signoff operationally clear and deterministic, with minimal operator guesswork.

## Current Problem

`audit:final` is explicit non-signoff evidence in WARN mode, but `audit:stable` failure behavior still leaves practical ambiguity around required strict artifacts and rerun expectations.

## Hardening Targets

1. Explicit required artifact contract for strict stable signoff:
   - installer artifact
   - versioned release bundle
   - strict hash-manifest requirement
   - optional CLI enforcement only when explicitly requested
2. Clear signoff state output:
   - `NON-SIGNOFF`
   - `BLOCKED`
   - `APPROVED`
3. Deterministic failure messaging:
   - exact missing artifact name/path expectation
   - exact rerun command path
4. Reduce generic fallback errors that hide signoff reason context.

## Validation

1. `npm run audit:final` clearly remains maintenance/non-signoff evidence.
2. `npm run audit:stable` failure (when strict artifacts are missing) is explicit, actionable, and unambiguous.
3. `npm run audit:stable` approval path messaging is explicit when strict requirements are met.
4. Full required gate order remains green after audit-surface changes.

## Execution Status

1. Completed in slice 1 (`fix(audit)`):
   - Added explicit signoff-state separation in audit output:
     - `SIGNOFF STATUS: NON-SIGNOFF`
     - `SIGNOFF STATUS: BLOCKED`
     - `SIGNOFF STATUS: APPROVED`
    - Added explicit strict artifact-path expectations at runtime:
      - `HyperSnatch-Setup-<version>.exe`
      - `HyperSnatch_Vanguard_v<version>.zip`
      - `SHA256SUMS.txt` (strict requirement)
      - `hypersnatch-cli.exe` (optional strict extension only when `HYPERSNATCH_AUDIT_REQUIRE_CLI=1`)
    - Added deterministic strict rerun guidance with exact expected paths and command (`npm run audit:stable`).
    - Tightened strict missing-artifact failures to include precise missing artifact path and reason code context.
2. Completed in slice 4 (`fix(build|audit)`):
   - Removed false default strict CLI requirement from `audit:stable` wrapper contract.
   - Kept optional strict CLI enforcement path via `HYPERSNATCH_AUDIT_REQUIRE_CLI=1`.
   - Added release-pack manifest generation (`SHA256SUMS.txt`, `MANIFEST.json`) to standard `npm run build:wrapper` flow.
   - Extended strict hash verification to validate installer + versioned release bundle entries/hashes.
