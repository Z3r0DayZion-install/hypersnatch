# v1.5.2 Hardening Plan

Date: 2026-03-20  
Branch: `release-readiness/v1.5.2-hardening`

## Objective

Deliver a narrow trust/proof hardening patch before any new expansion scope.

## In Scope

1. Audit strictness and proof-message clarity.
2. Artifact/version proof pinning for `verify` and `audit:final`.
3. UI proof-depth strengthening for critical operator-state truths.
4. Governance/status narrative alignment with shipped `v1.5.1` truth.

## Out of Scope

1. New feature families.
2. UI redesign.
3. Version bump while hardening work is still in progress.
4. Any `v1.6.0` expansion work.

## Required Gate Order

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`

## Success Criteria

1. Harder to fake-pass verification in dirty worktrees.
2. Clearer audit policy and failure messaging.
3. Stronger UI proof depth for operator-critical states.
4. Repo governance/status narrative matches shipped reality.

