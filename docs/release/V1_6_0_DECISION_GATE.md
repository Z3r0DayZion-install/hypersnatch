# v1.6.0 Decision Gate

Date: 2026-03-21  
Branch: `post-release/v1.5.8-reality-audit`

## Inputs Reviewed

- `docs/release/POST_V158_REALITY_AUDIT.md`
- `docs/ui/POST_V158_OPERATOR_FRICTION.md`

## Gate Check Against Decision Rule

### Clean enough for expansion?

Partially true:

- stable-order gates are clean and repeatable
- strict stable signoff is now operational (`audit:stable` reaches `SIGNOFF STATUS: APPROVED`)
- release identity and artifact proof pinning are clean
- proof-record discipline is intact

Not fully true:

- governance/status/setup narrative still lags shipped `v1.5.8` truth in top-level docs
- runtime UI proof remains stronger-but-indirect rather than full packaged interaction proof
- dependency/setup warning baseline is not yet synchronized to current install reality

### Remaining issue class

Remaining issues are trust/governance/proof P1 issues, not P2/P3 polish-only debt.

## Recommendation

Open:

- `release-readiness/v1.5.9-hardening`

Do not open:

- `feat/v1.6.0-expansion`

## Why This Is the Truthful Choice

1. `v1.5.8` fixed the operational signoff blocker, so release mechanics are now credible.
2. Top-level repo truth is still stale post-ship, which directly affects operator/reviewer trust.
3. UI proof confidence is materially better, but still not yet at full packaged interaction depth.
4. Dependency/setup warning evidence is lagging current runtime/install output.
5. Decision rule bias is to choose hardening when evidence is mixed; current evidence is improved but still mixed.

## Scope Constraint For v1.5.9

Keep `v1.5.9` hardening narrow:

- governance/status/setup truth synchronization to shipped `v1.5.8`
- dependency warning inventory refresh and setup narrative alignment
- packaged interaction proof deepening for operator-critical flows

No feature expansion and no UI redesign in this lane.
