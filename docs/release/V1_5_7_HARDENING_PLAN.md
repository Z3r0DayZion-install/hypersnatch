# v1.5.7 Hardening Plan

Date: 2026-03-20  
Branch: `release-readiness/v1.5.7-hardening`

## Objective

Close remaining trust-layer and governance-layer debt after shipped `v1.5.6` before any `v1.6.0` expansion.

## In Scope

1. WARN-default and strict signoff interpretation tightening.
2. Deeper runtime interaction proof in `verify:ui`.
3. Top-level governance/status/setup alignment to shipped `v1.5.6` truth.

## Out of Scope

1. Feature expansion (`v1.6.0` scope).
2. UI redesign or visual-only polish.
3. Version bump until hardening scope is complete.
4. Unrelated cleanup.

## Priority Build Order

1. `fix(audit)`: warn-default signoff interpretation tightening.
2. `test(ui)`: deeper runtime interaction proof.
3. `docs(governance)`: top-level narrative truth alignment.

## Required Gate Order

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`

## Success Criteria

1. WARN runs are harder to misread as strict stable signoff.
2. `verify:ui` has deeper runtime-state confidence on critical transitions.
3. Top-level docs reflect shipped `v1.5.6` and active `v1.5.7` hardening lane.
4. Required gate order stays green after each real slice.
