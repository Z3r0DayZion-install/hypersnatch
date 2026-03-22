# v1.5.10 Hardening Charter

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

## Intent

Close trust/governance/proof-depth debt from post-`v1.5.9` audit without widening runtime product capability.

This lane exists to:

- close truth lag
- normalize dependency baseline evidence
- convert indirect proof claims into more direct evidence
- reduce operator friction on release/signoff workflows

## Non-Negotiable Scope Guard

Allowed in this lane:

- ambiguity reduction
- proof strengthening
- governance/status/setup truth synchronization
- deterministic operator path hardening

Not allowed in this lane:

- new product capability
- UI redesign
- feature expansion disguised as cleanup
- unrelated refactors

Routing rule:

- If a change widens capability, it belongs to `feat/v1.6.0-expansion`.
- If a change narrows ambiguity or strengthens release truth/proof, it belongs here.

## Workstreams

1. Governance/setup truth closure
2. Dependency baseline normalization
3. Indirect-proof to direct-proof conversion
4. Operator friction reduction

## Exit Criteria

Do not open `feat/v1.6.0-expansion` until all are true:

1. P1 governance/setup truth lag is closed or explicitly downgraded with rationale.
2. Dependency baseline is current enough for release-trust claims.
3. Critical release claims have direct evidence artifacts, not inference-only chains.
4. Operator signoff path is simpler and less error-prone than `v1.5.9`.
5. Release proof/signoff language is technically conservative and aligned with runtime reality.
