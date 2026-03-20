# UI Beta Acceptance v1.5.0

Date: 2026-03-19
Target: `v1.5.0-beta.1`

## Scope

This acceptance focuses on operator workflow coherence for beta readiness:

- queue lifecycle and controls
- observability/failure intelligence
- case workspace depth
- reporting and lineage readability
- export truthfulness

## Required UI Behaviors

1. Queue state truth
- queued/running/paused/manual-review/completed/warning/failed/canceled states render clearly
- operator actions (pause/resume/cancel/manual-review/requeue) remain wired

2. Case workspace depth
- case summary card renders with linked counts and trust rollup
- linked job history appears for case-linked jobs
- empty/loading/error states are explicit and readable

3. Reporting quality
- structured report headings are deterministic
- risk sections exist for warning/failed/manual-review outcomes
- report content reflects actual state, not placeholders

4. Lineage and timeline
- job timeline and case timeline events render with timestamps
- reason chains render for warning/manual-review/failure paths
- lineage summary appears in case workspace

5. Export and navigation
- open queue/report/export actions from case context work
- batch and case report export variants produce Markdown + JSON

## Keyboard and Focus

- focus-visible states are present for interactive controls
- keyboard navigation remains functional in tabbed workflow shell

## Beta Verification Commands

```bash
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
npm run audit:final
```

Beta acceptance is not complete until all commands pass and no blocker-level UI truth issues remain.
