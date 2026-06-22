# v1.5.10 Governance Gaps

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This file tracks open truth/proof/governance gaps after slices 1 through 9.

## Open Gaps

| Gap ID | Severity | Truth Gap | Exact Fix Path | Fix Type | Status |
|---|---|---|---|---|---|
| G-02 | P1 | Packaged interaction proof is still partially indirect (marker/harness heavy) | `e2e/operator_ui.spec.js` (slice 6): 12-test Playwright click-path spec with stubbed IPC bridge, all passing; remaining gap is live Electron runtime IPC (no stub) | Technical + proof docs | Partially closed (click-path E2E added in slice 6; live packaged Electron runner bounded-deferred) |
| G-03 | P1 | Default strict signoff proves artifact/hash contract but does not by itself prove external signing trust acceptance | define explicit signing contract for stable releases (required vs optional), then align docs and automation checks accordingly | Policy + possible technical enforcement | Open (bounded-deferred in slice 4) |
| G-04 | P2 | Some legacy docs outside top-level governance packet can still imply stronger trust/support than current proof surfaces | scoped doc sweep completed in slice 7: `USER_GUIDE.md`, `VERIFY_RELEASE.md`, `SUPPLY_CHAIN_SECURITY.md`, `RELEASE_DAY_CHECKLIST.md` — proof-boundary caveats added, stale version stamps updated, signing/SLSA/Sigstore items marked aspirational | Doc-only | Closed (slice 7) |
| G-05 | P2 | Clean-machine assumptions are documented but not machine-checked by a dedicated preflight script | `scripts/preflight_check.js` added (slice 8): checks OS, Node >= 20.17.0, npm, package-lock.json, dist/ installer, stale artifact check, SHA256SUMS.txt, working tree state | Technical (supporting tooling) | Closed (slice 8) |
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

## Closed in Slice 9 (Operator Friction Reduction)

1. `scripts/release_gate.js`: single-command gate runner — collapses 6 manual release commands into `npm run release:gate`; stops on first failure, prints PASS/FAIL summary with next-step hint.
2. `package.json`: `release:gate` script wired.
3. `docs/release/CLEAN_WORKTREE_RELEASE_FLOW.md`: step 4 updated with Option A (`npm run release:gate`) as recommended path.
4. All 6 gate steps PASS on current environment.

## Closed in Slice 8 (G-05 Preflight Checker)

1. `scripts/preflight_check.js`: narrow read-only preflight checker verifying all required environment assumptions from `V1_5_10_ENVIRONMENT_ASSUMPTIONS.md`.
2. `package.json`: `npm run preflight` script wired.
3. All checks PASS on current environment; audit:stable APPROVED.

## Closed in Slice 7 (G-04 Doc Sweep — Overclaim Downgrade)

1. `docs/USER_GUIDE.md`: version stamp updated `v1.5.2` → `v1.5.9`; footer `Sovereign Authority Verified` replaced with scoped integrity claim.
2. `docs/VERIFY_RELEASE.md`: proof-boundary caveat added — signing artifacts (`manifest.sig`, `provenance.json`, etc.) not present in current release.
3. `docs/SUPPLY_CHAIN_SECURITY.md`: caveat added — Sigstore/SLSA/Ed25519/transparency log entries are aspirational, not currently active.
4. `docs/RELEASE_DAY_CHECKLIST.md`: caveat added — active vs planned pipeline steps clarified; example version refs (`v1.3.1`) noted as examples only.

## Closed in Slice 6 (PDG-01 Click-Path E2E Proof Deepening)

1. Packaged click-path interaction gap (G-02 / PDG-01) is materially narrowed via:
   - `e2e/operator_ui.spec.js`: 12-test Playwright spec against `ui/hypersnatch-ui.html`
   - Stubbed `electronAPI` + `smartDecode` IPC bridge
   - All 12 tests pass: decode pipeline, tab nav, case create/note/report/export/seal, clear
   - `V1_5_10_PDG_CLOSURE.md` and `V1_5_10_PROOF_DEPTH_GAPS.md` updated to reflect slice 6 narrowing
2. Remaining G-02 boundary: spec drives source HTML over HTTP with stubbed IPC — live Electron packaged app runtime IPC wiring is the final closure step (bounded-deferred)

## Closed in Slice 5 (UI/Brand/CLI/Dist Hygiene + Dependency Audit Refresh)

1. CLI version drift (`hypersnatch-cli.js` hardcoded `1.2.0` vs shipped `1.5.9`): closed — version now read from `package.json` at runtime.
2. Stale release artifacts in `dist/`: closed — `HyperSnatch-Setup-1.3.1.exe`, legacy `hashes.txt`, and old `manifest.json` removed; `clean:dist:stale` script added and wired.
3. Manifest scope drift (`generate_manifest.cjs` hashing all installer variants): closed — narrowed to current-release artifacts only.
4. Dev dependency vuln baseline stale (15 vulns): partially closed — `npm audit fix` applied, surface reduced to 6; remaining 6 registered as `G-06` (bounded-deferred, `electron-builder` chain).
5. UI brand identity: applied — `The Proof Foundry` kicker, brand logo SVG, and updated report header committed to `ui/`.
