# v1.5.3 Hardening Plan

Date: 2026-03-20  
Branch: `release-readiness/v1.5.3-hardening`

## Objective

Close remaining trust/proof/governance gaps after `v1.5.2` without adding new capability.

## In Scope

1. WARN-policy strictness and enforcement clarity.
2. Artifact/version proof pinning edge-case hardening.
3. UI proof-depth strengthening for runtime transition truth.
4. Governance/status/setup narrative alignment to shipped `v1.5.2` truth.

## Out of Scope

1. New feature expansion (`v1.6.0` scope).
2. UI redesign or visual refresh work.
3. Version bump until hardening work is complete.
4. Cleanup blobs unrelated to trust/proof reliability.

## Priority Build Order

1. Audit WARN-policy strictness model (`fix(audit)`).
2. Artifact/version proof pinning edge cases (`fix(release)`).
3. UI proof-depth runtime-transition assertions (`test(ui)`).
4. Governance/status/setup truth cleanup (`docs(governance)`, `docs(dev)`).

## Required Gate Order

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`

## Success Criteria

1. WARN profile behavior is explicit, enforceable, and not easy to misread.
2. Wrong-version/stale artifacts cannot satisfy verification/audit accidentally.
3. `verify:ui` proves more runtime transition truth, not only static hooks.
4. Governance/status/setup docs are aligned with shipped `v1.5.2` state.