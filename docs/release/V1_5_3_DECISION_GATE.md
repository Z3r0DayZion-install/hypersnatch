# v1.5.3 Decision Gate

Date: 2026-03-20  
Input docs:

- `docs/release/POST_V152_REALITY_AUDIT.md`
- `docs/ui/POST_V152_OPERATOR_FRICTION.md`

## Decision

Recommended next line:

- `release-readiness/v1.5.3-hardening`

## Decision Evidence

### Stable-for-expansion checks

1. Stable-order gates consistently clean: **Yes**
2. Release identity discipline clean: **Yes**
3. Version-pinned artifact proof behavior solid: **Yes**
4. WARN-profile behavior understood and non-misleading: **Partially**
5. Remaining issues mostly non-critical polish: **No**

### Why this is not `feat/v1.6.0-expansion` yet

Current evidence still contains P1 trust/proof/governance risks:

1. WARN-profile audit pass is explicit but still permissive by default, and strict-release policy is not yet enforced as a clear contract.
2. Top-level governance/status surfaces lag shipped `v1.5.2` truth, weakening release narrative integrity.
3. UI proof remains heavily static/hook based, with limited runtime-transition verification.
4. Dependency/setup governance references still point to prior-line (`v1.5.1`) naming in key maintenance notes.

These are maintenance hardening items, not expansion items.

## Required Scope for `release-readiness/v1.5.3-hardening`

Allowed:

1. Audit strictness policy codification for stable release proof (explicit strict vs warn contract).
2. Governance/status narrative alignment to shipped `v1.5.2` truth.
3. UI proof-depth hardening for runtime transition behavior in operator-critical flows.
4. Dependency/setup documentation normalization where it affects proof confidence.
5. No change to shipped `v1.5.2` release history.

Not allowed:

1. New feature families.
2. UI redesign.
3. Version bump during hardening execution.
4. `v1.6.0` expansion scope leakage.

## Exit Criteria Before `v1.6.0`

1. Stable-order clean-worktree proof remains green.
2. Audit profile policy for stable releases is explicit and non-ambiguous.
3. Governance/status docs reflect shipped truth through `v1.5.2` with no contradictions.
4. UI proof demonstrates stronger runtime-transition truth for queue/case/report/export/lineage critical paths.
5. Dependency/setup notes are current to active stable line.

## Blunt Recommendation

Open `release-readiness/v1.5.3-hardening`.  
Do not open `feat/v1.6.0-expansion` yet.