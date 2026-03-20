# Audit WARN Policy Plan v1.5.3

Date: 2026-03-20  
Branch: `release-readiness/v1.5.3-hardening`

## Goal

Make WARN-profile audit behavior explicit, enforceable, and difficult to misuse for strict-release claims.

## Focus Areas

1. Define stable release audit profile contract (warn-profile allowed vs strict-profile required).
2. Keep WARN scope clear and bounded in `audit:final` output.
3. Ensure remediation guidance is explicit and command-order specific.
4. Prevent ambiguous interpretation of PASS-with-warnings for stable-tag decisions.

## Planned Work Items

1. Tighten `tests/final_sovereign_audit.js` wording for WARN/FAIL policy boundaries.
2. Review `scripts/verify_release.js` and audit messaging for strictness consistency.
3. Document policy in release proof-plan surfaces so operators know when strict flags are mandatory.
4. Add/update gate docs to avoid tribal interpretation.

## Execution Status

1. Completed in slice 1:
   - Added explicit audit profile contract via `HYPERSNATCH_AUDIT_PROFILE` (`warn`/`strict`).
   - Added release-type contract via `HYPERSNATCH_AUDIT_RELEASE_TYPE` (`internal`/`prerelease`/`stable`).
   - Stable release mode now fails fast unless strict CLI/hash checks are enabled.
   - WARN output now prints explicit policy-result context (`profile` + `releaseType`) and strict rerun command.
   - Verified strict-path enforcement by running `audit:final` with `HYPERSNATCH_AUDIT_PROFILE=strict` and `HYPERSNATCH_AUDIT_RELEASE_TYPE=stable` (expected fail without CLI/hash artifacts).
2. Remaining:
   - Align release/gate docs so stable-proof examples consistently use strict profile contract.

## Exit Criteria

1. WARN output clearly states what is optional, what is mandatory, and when strict rerun is required.
2. Stable release proof instructions define strictness policy unambiguously.
3. No hidden assumptions remain in audit/verify remediation text.
