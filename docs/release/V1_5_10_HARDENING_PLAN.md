# v1.5.10 Hardening Execution Plan

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

## Workstream A: Governance/Setup Truth Closure

Targets:

- `README.md`
- `docs/PROJECT_STATUS.md`
- `docs/agent/MASTER_OVERVIEW.md`
- `docs/dev/WORKTREE_SETUP_NOTES.md`
- release/setup/user-facing summary docs that still lag shipped truth

Deliverables:

- setup truth matrix (`claim -> source of truth -> verification command -> failure condition`)
- environment assumptions doc (supported runtime/build assumptions)
- known non-native/test-context caveat registry
- governance checklist for overclaim detection

Acceptance:

- top-level docs and runtime/release truth are synchronized to shipped state
- no stale lane/version claims on entry-point docs

## Workstream B: Dependency Baseline Normalization

Targets:

- dependency warning inventory on current shipped line
- baseline delta from prior release line
- explicit hold/defer decisions for dependency risk items

Deliverables:

- versioned dependency manifest snapshot
- baseline delta note (`v1.5.9` vs prior)
- dependency decision log (`advance`, `hold`, `defer` with rationale)
- repeatable clean-install evidence capture

Acceptance:

- dependency baseline evidence is current, explicit, and release-proof aligned

## Workstream C: Direct Proof Conversion

Targets:

- release-critical claims currently asserted indirectly
- proof docs and verification scripts that rely on inference chains

Deliverables:

- direct evidence table (`claim -> artifact -> command/script -> pass condition`)
- proof bundle index
- downgraded/removed claims that cannot be directly evidenced

Acceptance:

- critical release claims are directly evidenced or explicitly downgraded

## Workstream D: Operator Friction Reduction

Targets:

- release/signoff operator path ambiguity
- interpretation-heavy steps in proof/signoff flow

Deliverables:

- friction-ranked remediation queue
- top 3 friction cuts implemented in `v1.5.10`
- before/after operator step count
- CLI transcripts/screenshots for simplification proof

Acceptance:

- operator path has fewer ambiguous steps and less interpretation risk

## Required Gate Order

Run in this exact order after each real slice:

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`
7. `npm run audit:stable`

## Commit Buckets

- `docs(governance): ...`
- `docs(dev): ...`
- `test(verify): ...`
- `fix(verify): ...` (only when needed to align direct-proof truth)

No mixed-scope commit blobs.
