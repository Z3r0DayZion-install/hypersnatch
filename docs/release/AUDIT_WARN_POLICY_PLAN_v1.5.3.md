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

## Exit Criteria

1. WARN output clearly states what is optional, what is mandatory, and when strict rerun is required.
2. Stable release proof instructions define strictness policy unambiguously.
3. No hidden assumptions remain in audit/verify remediation text.