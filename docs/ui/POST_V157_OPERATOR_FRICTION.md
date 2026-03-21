# Post-v1.5.7 Operator Friction Audit

Date: 2026-03-21  
Branch: `post-release/v1.5.7-reality-audit`

## Classification

- P0 = release blocker
- P1 = should harden before expansion
- P2 = minor friction / backlog
- P3 = optional future polish

## P0 (Release Blockers)

- None found for shipped `v1.5.7`.

## P1 (Should Harden Before Expansion)

### P1-1 Strict signoff path is still operationally brittle

- Surface: `npm run audit:stable` and `tests/final_sovereign_audit.js`
- Observed behavior:
  - `audit:final` (default WARN/internal) passes with warnings and explicit signoff block.
  - `audit:stable` currently fails on real `v1.5.7` dist (`CLI artifact required but not found`).
- Operator impact:
  - Signoff contract is explicit, but strict signoff evidence is hard to produce with default artifact profile.
  - This keeps signoff confidence partially dependent on manual interpretation/workaround decisions.

### P1-2 Governance/status/setup narrative lags shipped truth

- Surfaces:
  - `README.md`
  - `docs/PROJECT_STATUS.md`
  - `docs/agent/MASTER_OVERVIEW.md`
  - `docs/dev/WORKTREE_SETUP_NOTES.md`
- Observed behavior:
  - These still frame `v1.5.6` as current stable and `v1.5.7` as active hardening lane.
- Operator impact:
  - Onboarding and release-review context drift.
  - Increased chance of wrong branch/status assumptions in follow-on work.

### P1-3 Dependency/setup process surfaces are not fully synchronized

- Surfaces:
  - `docs/release/CLEAN_WORKTREE_RELEASE_FLOW.md`
  - `docs/dev/DEPENDENCY_WARNING_INVENTORY_*.md`
- Observed behavior:
  - Clean-worktree release flow command order differs from current canonical hardening gate order.
  - Dependency warning inventory has no `v1.5.6` or `v1.5.7` roll-forward file.
- Operator impact:
  - Setup confidence remains good in practice, but process docs still require manual reconciliation.

### P1-4 Runtime-proof confidence still has integration blind spots

- Surface: `npm run verify:ui` (`scripts/ui_smoke_check.js`)
- Observed behavior:
  - Strong semantic runtime checks exist for queue actions, case trust rollups, report sections, export readiness, and lineage timeline ordering.
  - Proof is still based on static HTML extraction + VM-compiled renderer function execution with mocks, not full packaged Electron interaction flow.
- Operator impact:
  - Queue truth and rollup semantics are stronger, but integration-level confidence (preload/IPC/packaged runtime behavior coupling) is not fully asserted by this gate alone.

## P2 (Minor Friction / Backlog)

### P2-1 Lineage/report density at scale

- Surface: case and batch report readability under large queue histories.
- Current state:
  - Report surfaces are useful and structurally truthful (risk sections, timeline sections, export metadata).
  - Narrative density can still be high for large case histories.
- Impact:
  - Usability friction, not release-integrity failure.

### P2-2 Dependency warning docs lag despite clean install run

- Surface: dependency warning inventory process.
- Current state:
  - Current `npm install` run is clean.
  - Versioned warning inventory still not rolled to release-truth baseline.
- Impact:
  - Documentation hygiene friction; low immediate technical risk.

## P3 (Optional Future Polish)

### P3-1 Additional UI evidence visual polish

- Surface: optional clarity improvements for status/lineage presentation.
- Impact:
  - Nice-to-have; not required for trust/proof correctness.

## Focus Area Scorecard

| Focus Area | Current State | Friction Level |
|---|---|---|
| Queue truth | Semantics strongly asserted in UI proof gate | Low |
| Case trust rollups | Runtime assertions present and useful | Low |
| Report usefulness | Structured and exportable (MD + JSON) | Low-Medium |
| Lineage readability | Semantically strong, can be dense at scale | Medium |
| Export truthfulness | Tri-state readiness and blocked-state messaging present | Low |
| Audit clarity | Messaging explicit (`SIGNOFF STATUS`, `SIGNOFF BLOCK`) | Medium (because strict path currently fails in default artifact profile) |
| Dependency/setup friction | Runtime checks strong, docs/inventory sync lag exists | Medium |
| WARN/signoff interpretation | Language improved materially | Medium (still operationally brittle) |
| Runtime-proof confidence | Much deeper than prior lines, still not full packaged-E2E | Medium |

## Friction Verdict

No P0 blockers were found, but P1 trust/proof/governance friction remains real.  
This still supports one more narrow hardening cycle before opening expansion.
