# v1.5.10 Governance Gaps

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This file tracks open truth/proof/governance gaps after slice 1.

## Open Gaps

| Gap ID | Severity | Truth Gap | Exact Fix Path | Fix Type | Status |
|---|---|---|---|---|---|
| G-01 | P1 | Dependency warning baseline is still one line behind (`docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.8.md`) while shipped line is `v1.5.9` | create `docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.9.md`, update setup references, record clean-install evidence | Doc-only | Open (slice 2 target) |
| G-02 | P1 | Packaged interaction proof is still partially indirect (marker/harness heavy) | extend packaged/runtime proof depth for queue/manual-review/reopen/export/report lineage behavior with stronger packaged assertions | Technical + proof docs | Open (slice 3 target) |
| G-03 | P1 | Default strict signoff proves artifact/hash contract but does not by itself prove external signing trust acceptance | define explicit signing contract for stable releases (required vs optional), then align docs and automation checks accordingly | Policy + possible technical enforcement | Open |
| G-04 | P2 | Some legacy docs outside top-level governance packet can still imply stronger trust/support than current proof surfaces | run scoped doc sweep on release/setup/user docs and downgrade overclaims to claim-map language | Doc-only | Open |
| G-05 | P2 | Clean-machine assumptions are documented but not machine-checked by a dedicated preflight script | optionally add a narrow preflight checker for required environment assumptions (no runtime behavior change) | Technical (supporting tooling) | Open |

## Closed in Slice 1

1. Top-level shipped-truth lag on core entry docs (`README.md`, `docs/PROJECT_STATUS.md`, `docs/agent/MASTER_OVERVIEW.md`).
2. Setup/signoff assumption clarity in `docs/dev/WORKTREE_SETUP_NOTES.md`.
3. Centralized setup-truth packet for required vs optional, assumptions, and claim-to-proof boundaries.
