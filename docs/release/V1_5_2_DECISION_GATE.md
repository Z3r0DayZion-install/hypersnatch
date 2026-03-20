# v1.5.2 Decision Gate

Date: 2026-03-20  
Input docs:

- `docs/release/POST_V151_REALITY_AUDIT.md`
- `docs/ui/POST_V151_OPERATOR_FRICTION.md`

## Decision

Recommended next line:

- `release-readiness/v1.5.2-hardening`

## Decision Evidence

### Stable-for-expansion checks

1. Stable-order gates consistently clean: **Yes**
2. Release identity discipline clean: **Yes**
3. WARN-mode audit behavior understood: **Partially**
4. Remaining issues mostly non-critical polish: **No**

### Why this is not `feat/v1.6.0-expansion` yet

The current evidence includes P1 trust/proof risks that are corrective, not additive:

1. Verification/audit artifact selection can pass against stale installers in dirty `dist` contexts.
2. WARN-mode audit defaults are explicit but still policy-soft for strict release assurance without a pinned stable profile.
3. UI proof remains hook-heavy and does not execute key runtime interaction truth paths end-to-end.
4. Post-release status narrative drift weakens governance confidence.

These are exactly the issues that should be closed before opening a new expansion line.

## Required Scope for `release-readiness/v1.5.2-hardening`

Allowed:

1. Version-pinned installer/assertion logic in `verify` and `audit:final`.
2. Stable audit profile contract (strict vs bounded warn mode) documented and enforced.
3. Runtime-oriented UI proof depth for critical operator transitions.
4. Post-ship status/release-proof doc truth alignment for `v1.5.1`.
5. Dependency/setup confidence clarifications where they affect reproducible proof.

Not allowed:

1. New feature families.
2. UI redesign.
3. Unrelated cleanup blobs.
4. Early `v1.6.0` scope under hardening branch.

## Exit Criteria Before v1.6.0

1. Full stable-order clean-worktree proof remains green.
2. Artifact verification ties directly to current version identity.
3. Audit strictness policy is explicit and non-ambiguous for stable releases.
4. UI proof covers runtime truth transitions for queue/case/report/export/lineage high-risk states.
5. Status/proof docs reflect shipped reality with no release-state contradictions.

## Blunt Recommendation

Open `release-readiness/v1.5.2-hardening` next.  
Do not open `feat/v1.6.0-expansion` until the above trust/proof tightening is complete.

