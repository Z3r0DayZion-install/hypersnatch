# v1.5.4 Decision Gate

Date: 2026-03-20  
Input docs:

- `docs/release/POST_V153_REALITY_AUDIT.md`
- `docs/ui/POST_V153_OPERATOR_FRICTION.md`

## Decision

Recommended next line:

- `release-readiness/v1.5.4-hardening`

## Decision Evidence

### Stable-for-expansion checks

1. Stable-order gates consistently clean: **Yes**
2. Release identity discipline clean: **Yes**
3. Version-pinned artifact proof behavior solid: **Yes**
4. WARN-profile behavior understood and non-misleading: **Partially**
5. Remaining issues mostly non-critical polish: **No**

### Why this is not `feat/v1.6.0-expansion` yet

Current evidence still contains P1 trust/proof/governance risks:

1. WARN-profile default remains permissive and can still be interpreted as strict signoff unless release policy is enforced more tightly.
2. Governance/status narrative still has lagging `v1.5.2`-current references after `v1.5.3` stable ship.
3. `verify:ui` proof remains static-analysis dominant and does not yet execute critical runtime interaction transitions.

These are hardening items and should be closed before adding new capability scope.

## Required Scope for `release-readiness/v1.5.4-hardening`

Allowed:

1. Tighten audit policy defaults and strict stable-signoff semantics.
2. Align governance/status/setup/dependency narrative to `v1.5.3` shipped truth.
3. Add runtime-oriented UI proof execution for high-risk transition flows.
4. Preserve existing release history and immutable proof chain.

Not allowed:

1. New feature families.
2. UI redesign.
3. Early `v1.6.0` expansion scope.
4. Version bump during hardening execution.

## Exit Criteria Before `v1.6.0`

1. Stable signoff profile is explicit, enforceable, and hard to misread.
2. Top-level status/governance docs match shipped `v1.5.3` truth with no contradictions.
3. UI proof includes deeper runtime transition checks for queue/case/report/export/lineage critical paths.
4. Stable-order clean-worktree proof remains green.

## Blunt Recommendation

Open `release-readiness/v1.5.4-hardening`.  
Do not open `feat/v1.6.0-expansion` yet.
