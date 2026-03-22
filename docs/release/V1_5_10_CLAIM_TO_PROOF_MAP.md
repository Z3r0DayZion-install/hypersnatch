# v1.5.10 Claim-to-Proof Map

Date: 2026-03-22  
Branch: `proof-upgrade/pdg-runtime-closure`

This map is the release-facing summary.  
For operational detail and upgrade paths, see:

- `docs/release/V1_5_10_DIRECT_PROOF_REGISTER.md`
- `docs/release/V1_5_10_PACKAGED_INTERACTION_PROOF.md`
- `docs/release/V1_5_10_PROOF_DEPTH_GAPS.md`
- `docs/release/V1_5_10_SIGNOFF_LANGUAGE_NORMALIZATION.md`
- `docs/release/V1_5_10_PDG_CLOSURE.md`
- `docs/release/PDG_RUNTIME_CLOSURE_RESULTS.md`

## Release-Critical Claims

| Claim ID | Claim | Current Proof Type | Direct vs Indirect | Primary Evidence Surface | Conservative Allowed Wording | Upgrade Path (if indirect) | Proof-Upgrade Status |
|---|---|---|---|---|---|---|---|
| C-01 | Version identity is aligned for release commit | Artifact + command output | Direct | `package.json`, `VERSION.json`, versioned dist artifact names | "version identity is aligned on this commit/worktree" | n/a | Direct |
| C-02 | Strict stable signoff is approved | Command output token | Direct | `npm run audit:stable` -> `SIGNOFF STATUS: APPROVED` | "strict stable signoff approved for this run" | n/a | Direct |
| C-03 | `audit:final` is not stable signoff approval | Command output token | Direct | `npm run audit:final` -> `SIGNOFF STATUS: NON-SIGNOFF` | "`audit:final` is maintenance evidence only" | n/a | Direct |
| C-04 | Installer + versioned bundle + hash manifest contract is satisfied | Artifact + command output token | Direct | strict checks in `audit:stable` + `SHA256SUMS.txt` | "strict artifact/hash contract passed" | n/a | Direct |
| C-05 | Dist artifact set is version-clean (no mixed stale versions) | Deterministic fail/pass behavior | Direct | `verify` + `audit:stable` stale/mixed artifact guards | "artifact set is clean for this proof run" | n/a | Direct |
| C-06 | Packaged runtime bundle includes required operator/runtime markers | Packaged artifact marker scan | Direct (marker-level) | `verify` packaged `app.asar` marker checks | "packaged marker set is present" | add packaged click-path interaction assertions | Direct marker-level only |
| C-07 | Queue/report/reopen/export runtime semantics are verified | Packaged runtime-function assertions + harness assertions | Direct for packaged method-level semantics; indirect for full packaged click-path E2E | `npm run verify` (`verify_packaged_runtime_interactions.js`) + `npm run verify:ui` | "packaged method-level runtime semantics are proven; full packaged click-path E2E remains partial" | add packaged live click-path/event-loop runner assertions | BOUNDED-DEFERRED (materially narrowed, PDG-01) |
| C-08 | Core test suite passes for current commit | Command output | Direct | `npm test` | "covered tests passed in this environment" | n/a | Direct |
| C-09 | Release-readiness gate sequence is reproducible | Ordered command evidence | Direct (observed environment) | required gate sequence + clean worktree checks | "reproduced in clean worktree using documented order" | optional environment preflight automation | Direct |
| C-10 | Dependency baseline evidence is current to shipped line | Versioned documentation + install evidence | Direct (snapshot), indirect for future drift | dependency packet (`V1_5_10_DEPENDENCY_*`) + `DEPENDENCY_WARNING_INVENTORY_v1.5.9.md` | "dependency baseline is current for this release line with explicit risks documented" | refresh baseline each release line and keep risk register current | Direct (snapshot) |
| C-11 | Binary trust is externally accepted/signed | In-gate signature-boundary probe + conditional signing evidence | Direct for signature-state boundary capture; indirect for external trust acceptance closure | `npm run verify` (`verify_binary_signature_boundary.js`) + signing artifacts when enabled | "signature-state boundary is captured; signed trust claim is only valid when explicit signing evidence is recorded" | define/enforce signing contract in strict release policy and require signed evidence for closure | BOUNDED-DEFERRED (materially narrowed, PDG-02) |
| C-12 | Governance docs reflect shipped truth and active lane | Documentation evidence | Direct | top-level governance packet | "top-level governance docs aligned to shipped `v1.5.9` and active `v1.5.10` lane" | n/a | Direct |

## Language Rules

1. Do not claim full packaged interaction proof when only marker/harness evidence exists.
2. Do not claim trusted/signed binary status without explicit signing evidence.
3. Do not treat `audit:final` as stable signoff approval.
4. Use normalization rules in `V1_5_10_SIGNOFF_LANGUAGE_NORMALIZATION.md`.
