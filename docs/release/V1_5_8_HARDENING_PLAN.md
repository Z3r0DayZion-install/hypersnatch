# v1.5.8 Hardening Plan

Date: 2026-03-21  
Branch: `release-readiness/v1.5.8-hardening`

## Objective

Execute the post-`v1.5.7` reality-audit decision: one narrow hardening pass before any `v1.6.0` expansion.

## Scope Constraints

1. No version bump in this branch.
2. No feature expansion.
3. No UI redesign.
4. No unrelated cleanup.

## Hardening Slices

1. `fix(audit)`:
   - operationalize strict stable signoff behavior
   - make strict artifact requirements explicit and deterministic
   - resolve the CLI requirement fork truthfully (optional by default; enforce only when explicitly requested)
   - make signoff state unmistakable (`non-signoff`, `blocked`, `approved`)
2. `docs(governance)`:
   - align top-level repo truth to shipped `v1.5.7`
   - set active lane to `release-readiness/v1.5.8-hardening`
   - align setup/dependency/signoff guidance to current release workflow
3. `test(ui)` (and minimal `fix(ui)` only if required by proof):
   - deepen packaged/runtime confidence for queue/manual-review/reopen/report/export/lineage flows
   - push proof toward state-change semantics over indirect assertions
4. `fix(build|audit)`:
   - operationalize strict hash-manifest generation in the standard `build:wrapper` flow
   - make `audit:stable` pass/fail deterministic against the truthful strict contract

## Required Gate Order

Run in this exact order after each real slice:

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`
7. `npm run audit:stable`

## Completion Criteria

1. Strict stable signoff behavior is explicit, deterministic, and low-ambiguity.
2. Top-level governance/status/setup docs reflect shipped `v1.5.7` truth.
3. UI proof depth is stronger on runtime interaction state changes.
4. All required gates pass in the required order for code/proof slices.
5. `npm run audit:stable` is operational and no longer blocked by a false strict CLI requirement.
