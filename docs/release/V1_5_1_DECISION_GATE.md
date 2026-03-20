# v1.5.1 Decision Gate

Date: 2026-03-19
Input docs:

- `docs/release/POST_V150_REALITY_AUDIT.md`
- `docs/ui/POST_V150_OPERATOR_FRICTION.md`

## Decision

Recommended next line:

- `release-readiness/v1.5.1-hardening`

## Why this line (and not v1.6.0 yet)

`v1.6.0-expansion` requires a calm stable line with no real P0/P1 corrective issues.

Current audit identified real P1 items that are corrective, not additive:

1. `audit:final` hash verification skip when `SHA256SUMS.txt` is missing.
2. `audit:final` CLI coverage ambiguity (`SKIPPED` in current profile).
3. Dependency hygiene/repro confidence warnings in clean setup.
4. UI proof-depth gap for end-to-end state-truth assertions.

These are hardening/trust issues and belong on the stable lane first.

## Scope for `release-readiness/v1.5.1-hardening`

Allowed:

- proof-depth and audit-truth fixes
- reproducibility/setup hardening
- verify/build/audit contract tightening
- UI proof-gate strengthening for state truth
- documentation truth updates tied to the above

Not allowed:

- new feature families
- major redesign
- speculative expansion scope
- unrelated cleanup blobs

## Exit Criteria for v1.5.1 Hardening

1. Full stable-order gates pass in clean worktree:
   - `npm install`
   - `npm test`
   - `npm run verify:ui`
   - `npm run build:wrapper`
   - `npm run verify`
   - `npm run audit:final`
2. `audit:final` behavior is explicit/truthful for hash and CLI coverage policy.
3. UI proof checks cover key state-truth paths beyond presence-only smoke.
4. Release docs reflect actual proof contract with no ambiguous skips.

## Follow-on Rule

After `v1.5.1` hardening is complete and proven clean, open `feat/v1.6.0-expansion` with one primary expansion theme only.
