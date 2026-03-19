# v1.5.0 Scope

Date: 2026-03-19
Branch: `feat/v1.5.0-expansion`
Baseline stable: `v1.4.1` (`205ecdaa49d7a64039793bbabbb3d4645502f770`)
Proof baseline doc: `docs/release/RELEASE_PROOF_v1.4.1.md`

## Release Intent

Ship meaningful operator capability on top of the stable `v1.4.1` line.
This track is for expansion work, not patch-line cleanup.

## In Scope (Expansion)

1. Multi-case operator workflows
- Cross-case compare view for bundles, entities, and signatures.
- Cross-case pivots from trust/proof and results surfaces.

2. Advanced decode orchestration
- Batch job queue controls (pause/resume/cancel/retry) with truthful per-job state.
- Explicit partial-failure handling and operator recovery guidance.

3. Evidence and audit surfaces
- Rich evidence timeline and relationship graph with practical filter presets.
- Operator-readable proof summaries designed for incident handoff.

4. Reporting and export upgrades
- Structured report package output with provenance metadata.
- Export presets for executive brief and technical appendix workflows.

## Out of Scope

- Visual-only polish with no workflow capability gain.
- Feature-unrelated refactors and architecture churn.
- Patch-line chores (identity alignment, artifact renaming, release-path cleanup).
- Breaking stable `v1.4.x` behavior without a compatibility plan.

## Scope Boundary Rule

A change is in scope only if it adds operator capability or removes an expansion blocker.
If it is only hardening or polish, defer it to a patch-line branch.

## Delivery Slices

- Slice A: Cross-case compare and pivots.
- Slice B: Batch orchestration controls and state model.
- Slice C: Evidence graph and timeline upgrades.
- Slice D: Report/export package upgrades.
- Slice E: Verification and regression expansion for new workflows.

## Verification Expansion (Required)

- Extend `npm run verify:ui` to assert new operator flow states and failure messaging.
- Add deterministic tests for batch orchestration state transitions.
- Add regression checks for export package provenance fields.
- Preserve existing mandatory gates:

```bash
npm test
npm run verify:ui
npm run build:wrapper
npm run verify
npm run audit:final
```

## Definition of Done (v1.5.0)

- New capability is demonstrable in operator workflow, not only in code paths.
- Expansion-specific tests are added and deterministic.
- Existing release gates remain green on merged `main`.
- Release proof is captured from a clean throwaway worktree before tagging.

## Deferred by Default

- Cosmetic-only typography/layout adjustments.
- Experimental redesign work not tied to expansion workflows.
- Non-blocking patch-level hardening items.
