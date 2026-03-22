# v1.5.10 Dependency Risk Register

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This register records dependency risks that can still affect release-trust confidence.

## Risk Register

| Risk ID | Severity | Risk | Current State | Reason Held | Action Path |
|---|---|---|---|---|---|
| DR-01 | P1 | Range declarations (`^`) can drift when lockfile is regenerated | Open | Top-level dependencies include 4 range-based entries | Keep lockfile committed; do not regenerate without explicit review; record intentional dependency updates in release docs |
| DR-02 | P1 | Lockfile contains deprecated transitive packages | Open | 3 deprecated entries observed (`glob` via `config-file-ts`, `tar`, `whatwg-encoding`) | Classify as transitive/tooling risk; track upstream updates; evaluate override/upgrade path in future hardening slice if feasible |
| DR-03 | P1 | Node/npm toolchain drift across operators can alter install behavior | Open | Baseline proof run used Node `20.17.0`, npm `10.8.2` | Keep environment assumptions explicit; consider optional preflight enforcement in later slice |
| DR-04 | P2 | Install reproducibility proof is environment-scoped | Open | Clean install evidence currently from one controlled proof environment | Continue capturing versioned clean-install proof each release line; add multi-environment evidence if trust contract expands |
| DR-05 | P2 | Registry/network variability can affect clean installs | Open | Not observed in this run; external dependency remains | Maintain deterministic lockfile and rerun guidance; treat outages as operational blocker, not proof pass |

## Risk Posture Summary

1. No line-to-line dependency drift was found between `v1.5.8` and `v1.5.9`.
2. Remaining dependency risk is known and documented, not hidden.
3. Release docs should claim "baseline governed with known risks," not "dependency certainty guaranteed."
