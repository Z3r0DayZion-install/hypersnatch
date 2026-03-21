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
   - strict CLI artifact requirement
   - strict hash-manifest requirement
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
