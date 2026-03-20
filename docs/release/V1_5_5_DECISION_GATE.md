# v1.5.5 Decision Gate

Date: 2026-03-20  
Input docs:

- `docs/release/POST_V154_REALITY_AUDIT.md`
- `docs/ui/POST_V154_OPERATOR_FRICTION.md`

## Decision

Recommended next line:

- `release-readiness/v1.5.5-hardening`

## Decision Evidence

### Stable-for-expansion checks

1. Stable-order gates consistently clean: **Yes**
2. Release identity discipline clean: **Yes**
3. Artifact/version proof behavior solid: **Yes**
4. WARN-profile behavior understood and non-misleading: **Partially**
5. Remaining issues mostly non-critical polish: **No**

### Why this is not `feat/v1.6.0-expansion` yet

Current evidence still contains active trust-layer P1 items:

1. Governance/status top-level surfaces are already lagging shipped `v1.5.4` truth.
2. WARN default remains permissive and still depends on operator discipline for strict stable signoff.
3. UI proof remains stronger but still short of full interaction-level runtime verification.

These are hardening items and should be closed before expansion work.

## Required Scope for `release-readiness/v1.5.5-hardening`

Allowed:

1. Governance/status/setup narrative alignment to shipped `v1.5.4` truth.
2. Further WARN-policy tightening for stable signoff clarity.
3. Higher-fidelity runtime interaction proof additions for critical UI transitions.
4. Dependency/setup confidence updates only where they affect proof trust.

Not allowed:

1. New feature families.
2. UI redesign.
3. `v1.6.0` scope leakage.
4. Version bump during hardening execution.

## Exit Criteria Before `v1.6.0`

1. Top-level docs and status surfaces align with shipped `v1.5.4` truth.
2. Stable signoff policy is explicit and difficult to misapply.
3. UI proof has stronger interaction-level runtime trust coverage.
4. Stable-order clean-worktree proof remains green.

## Blunt Recommendation

Open `release-readiness/v1.5.5-hardening`.  
Do not open `feat/v1.6.0-expansion` yet.
