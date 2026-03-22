# v1.5.10 Signoff Language Normalization

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This file defines approved and banned release/signoff wording so proof language remains technically conservative.

## Approved Wording

### Release-Ready (Scoped)

Use only when required gate order passes and `audit:stable` is approved.

Approved:

1. "Release-readiness gates passed in required order on this commit/worktree."
2. "Strict stable signoff is approved for this run (`SIGNOFF STATUS: APPROVED`)."
3. "Release-ready claim is scoped to the documented environment and evidence surfaces."

### Non-Signoff

Approved:

1. "`audit:final` is maintenance evidence only (`SIGNOFF STATUS: NON-SIGNOFF`)."
2. "`audit:final` does not approve stable tag/release actions."

### Strict Signoff

Approved:

1. "`audit:stable` is the strict stable signoff command."
2. "Stable release/tag actions require `audit:stable` approval."

### Packaged Proof

Approved:

1. "Packaged runtime markers were verified from `app.asar`."
2. "Packaged marker verification is direct for marker presence, not full packaged click-path E2E."

### Trust Caveat

Approved:

1. "Artifact/hash/signoff contract is proven; external OS trust acceptance is separate unless signing evidence is provided."
2. "Signed trust claims are only valid when signing evidence is explicitly recorded."

## Banned Wording

| Banned Wording | Why Banned | Approved Replacement |
|---|---|---|
| "Fully verified runtime behavior" | overclaims beyond marker/harness scope | "Runtime behavior is verified for documented marker/harness surfaces; packaged E2E remains partial." |
| "`audit:final` approved stable signoff" | false per signoff contract | "`audit:final` is NON-SIGNOFF maintenance evidence." |
| "Trusted binary" (without signing evidence) | confuses strict hash/signoff with external trust chain proof | "Artifact/hash/signoff contract passed; signing trust not claimed without explicit evidence." |
| "Dependency baseline is guaranteed stable" | overstates snapshot evidence | "Dependency baseline is current for this release line with explicit risk register." |
| "Packaged interaction is fully proven" | current proof depth is partly indirect | "Packaged marker set is directly proven; packaged interaction E2E remains a tracked gap." |

## Enforcement Rule

For release docs in this hardening line:

1. Use approved wording in this file.
2. Replace banned wording when encountered.
3. If a stronger claim is needed, add direct evidence first, then update wording.
