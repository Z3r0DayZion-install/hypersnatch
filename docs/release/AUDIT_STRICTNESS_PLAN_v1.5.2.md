# Audit Strictness Plan v1.5.2

Date: 2026-03-20  
Branch: `release-readiness/v1.5.2-hardening`

## Goal

Make `audit:final` and release verification outputs strict enough to prevent false-confidence passes while keeping policy explicit.

## Work Items

1. Version-pin installer checks to current `package.json` version.
2. Fail clearly when stale installers in `dist` can contaminate proof.
3. Keep WARN-mode behavior explicit and intentional (no ambiguous skip language).
4. Improve remediation hints so operators know exact recovery steps.

## Policy Surfaces

1. `HYPERSNATCH_AUDIT_REQUIRE_HASH`
2. `HYPERSNATCH_AUDIT_REQUIRE_CLI`
3. Audit summary and remediation lines in `tests/final_sovereign_audit.js`

## Exit Criteria

1. Audit output is explicit on policy mode and strictness.
2. Artifact mismatch/stale-dist states fail with actionable guidance.
3. Full stable-order gates remain green.

## Execution Status

1. Completed in slice 1:
   - `audit:final` enforces version-pinned installer expectations
   - stale installer versions now fail with explicit remediation
   - WARN-mode scope and strict-flag policy hints are explicit in final output
2. Validated by full stable-order gate pass.
