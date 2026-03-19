# Stable Engine Policy v1.4.0

Date: 2026-03-19
Branch: `release-readiness/v1.4.0-stable`

## Decision

Chosen path: **Option B** (keep current project Node baseline, eliminate drift).

## Baseline

- Project Node baseline remains: `20.17.0`
- Source of truth: `package.json` `engines.node`

## Why This Path

The beta line exposed `EBADENGINE` warnings from transitive packages requiring Node `>=20.19.0`.
For stable, we kept the existing baseline and removed the warning source instead of silently raising runtime requirements at release time.

## Implementation

1. Pinned `jsdom` from `^27.0.1` to exact `26.1.0` in `package.json`.
2. Regenerated `package-lock.json` via fresh install.
3. Revalidated clean install behavior under Node `20.17.0`.

## Result

- `npm install` on this stable branch no longer emits the prior `EBADENGINE` warnings.
- Remaining warnings are non-engine deprecation notices and do not indicate runtime baseline ambiguity.

## Stable Acceptance Statement

Engine/runtime policy is now explicit and resolved for `v1.4.0`:

- baseline is unchanged (`20.17.0`)
- transitive engine mismatch path was removed
- stable proof gates can be run without unresolved Node-version ambiguity
