# v1.5.5 Hardening Plan

Date: 2026-03-20  
Branch: `release-readiness/v1.5.5-hardening`

## Objective

Close remaining trust-layer debt after `v1.5.4` without adding new capability.

## In Scope

1. WARN default interpretation tightening and strict-signoff guidance hardening.
2. Runtime interaction proof deepening in `verify:ui`.
3. Top-level governance/status/setup narrative alignment to shipped `v1.5.4` truth.

## Out of Scope

1. New feature expansion (`v1.6.0` scope).
2. UI redesign or visual polish-only work.
3. Version bump until hardening scope is complete.
4. Unrelated cleanup blobs.

## Priority Build Order

1. WARN-default interpretation and signoff guidance (`fix(audit)`).
2. Runtime interaction proof deepening (`test(ui)`).
3. Governance/status/setup truth alignment (`docs(governance)`).

## Required Gate Order

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`

## Success Criteria

1. WARN mode is harder to misread as stable signoff.
2. `verify:ui` proves deeper interaction-level runtime truth.
3. Top-level status/governance/setup surfaces match shipped `v1.5.4` truth.
4. Stable gate order remains green after each real hardening slice.
