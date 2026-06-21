# v1.5.10 Governance Gaps

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This file tracks open truth/proof/governance gaps after slices 1 through 5.

## Open Gaps

| Gap ID | Severity | Truth Gap | Exact Fix Path | Fix Type | Status |
|---|---|---|---|---|---|
| G-02 | P1 | Packaged interaction proof is still partially indirect (marker/harness heavy) | keep `V1_5_10_PACKAGED_INTERACTION_PROOF.md` + `V1_5_10_PROOF_DEPTH_GAPS.md` as boundary; add packaged interaction runner assertions in future technical slice | Technical + proof docs | Open (bounded-deferred in slice 4) |
| G-03 | P1 | Default strict signoff proves artifact/hash contract but does not by itself prove external signing trust acceptance | define explicit signing contract for stable releases (required vs optional), then align docs and automation checks accordingly | Policy + possible technical enforcement | Open (bounded-deferred in slice 4) |
| G-04 | P2 | Some legacy docs outside top-level governance packet can still imply stronger trust/support than current proof surfaces | run scoped doc sweep on release/setup/user docs and downgrade overclaims to claim-map language | Doc-only | Open |
| G-05 | P2 | Clean-machine assumptions are documented but not machine-checked by a dedicated preflight script | optionally add a narrow preflight checker for required environment assumptions (no runtime behavior change) | Technical (supporting tooling) | Open |
| G-06 | P2 | `electron-builder` transitive dependency chain has 6 high-severity vulns not addressable without breaking changes | track as bounded-deferred; address during `electron-builder` upgrade cycle outside `v1.5.10` hardening scope | Dependency upgrade (out of scope for hardening lane) | Open (bounded-deferred in slice 5) |

## Closed in Slice 1

1. Top-level shipped-truth lag on core entry docs (`README.md`, `docs/PROJECT_STATUS.md`, `docs/agent/MASTER_OVERVIEW.md`).
2. Setup/signoff assumption clarity in `docs/dev/WORKTREE_SETUP_NOTES.md`.
3. Centralized setup-truth packet for required vs optional, assumptions, and claim-to-proof boundaries.

## Closed in Slice 2

1. Dependency baseline lag from `v1.5.8` to `v1.5.9` is closed with:
   - `docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.9.md`
   - `docs/release/V1_5_10_DEPENDENCY_BASELINE.md`
   - `docs/release/V1_5_10_DEPENDENCY_DELTA.md`
   - `docs/release/V1_5_10_DEPENDENCY_RISK_REGISTER.md`
   - `docs/release/V1_5_10_CLEAN_ENV_INSTALL_PROOF.md`

## Closed in Slice 3 (Documentation Boundary Tightening)

1. Direct vs indirect proof language ambiguity is reduced via:
   - `docs/release/V1_5_10_DIRECT_PROOF_REGISTER.md`
   - `docs/release/V1_5_10_SIGNOFF_LANGUAGE_NORMALIZATION.md`
2. Packaged interaction proof boundary is explicitly documented via:
   - `docs/release/V1_5_10_PACKAGED_INTERACTION_PROOF.md`
   - `docs/release/V1_5_10_PROOF_DEPTH_GAPS.md`

## Closed in Slice 4 (PDG Decision Layer)

1. PDG closure status is explicit via:
   - `docs/release/V1_5_10_RUNTIME_INTERACTION_PROOF.md`
   - `docs/release/V1_5_10_PDG_CLOSURE.md`
2. Branch-level hardening decision is explicit via:
   - `docs/release/V1_5_10_HARDENING_DECISION.md`

## Closed in Slice 5 (UI/Brand/CLI/Dist Hygiene + Dependency Audit Refresh)

1. CLI version drift (`hypersnatch-cli.js` hardcoded `1.2.0` vs shipped `1.5.9`): closed — version now read from `package.json` at runtime.
2. Stale release artifacts in `dist/`: closed — `HyperSnatch-Setup-1.3.1.exe`, legacy `hashes.txt`, and old `manifest.json` removed; `clean:dist:stale` script added and wired.
3. Manifest scope drift (`generate_manifest.cjs` hashing all installer variants): closed — narrowed to current-release artifacts only.
4. Dev dependency vuln baseline stale (15 vulns): partially closed — `npm audit fix` applied, surface reduced to 6; remaining 6 registered as `G-06` (bounded-deferred, `electron-builder` chain).
5. UI brand identity: applied — `The Proof Factory` kicker, factory-motif logo SVG, and updated report header committed to `ui/`.
