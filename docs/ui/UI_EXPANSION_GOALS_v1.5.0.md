# UI Expansion Goals v1.5.0

Date: 2026-03-19
Branch: `feat/v1.5.0-expansion`
Scope anchor: `docs/release/V1_5_0_SCOPE.md`

## Objective

Define UI work that enables new operator capability for `v1.5.0`.
This is not a general restyle or polish pass.

## Primary Workflow Goals

1. Intake to batch orchestration
- Operators can launch, monitor, and control multi-job decode work from one shell.
- Queue state is explicit: queued, running, paused, complete, warning, failed, canceled.
- UI never reports success when a job has warning or failure outcome.

2. Cross-case comparison
- Operators can compare at least two cases side by side with synchronized context.
- Pivots are possible by entity, host, signature, and bundle fingerprint.
- Diff signals are visible without requiring raw JSON inspection.

3. Evidence graph and timeline
- Relationship graph supports filter presets and drill-down without losing context.
- Timeline supports severity/source filtering and direct jump to underlying evidence.
- Empty/loading/error states are explicit and operator-readable.

4. Reporting and export flow
- Report wizard supports package presets (brief and technical appendix).
- Export results display explicit success/failure status and output path.
- Export metadata includes origin case IDs and generation timestamp.

## Interaction and Accessibility Goals

- Keyboard-only navigation is complete across new workflow controls.
- Focus visibility remains explicit on all actionable controls.
- Live status regions announce queue and export outcomes truthfully.
- Responsive behavior must remain usable at common laptop and 1080p layouts.

## UI Acceptance Targets

- No hidden destructive actions; cancel and retry flows require explicit intent.
- Error messages identify action, failure cause, and suggested next step.
- Trust/proof context remains visible while operators switch workflow tabs.
- Operator state is preserved when moving between compare, graph, and export views.

## `verify:ui` Expansion Targets

- Assert queue state labels and transitions for batch controls.
- Assert explicit failure messaging for orchestration and export actions.
- Assert presence of cross-case compare anchors and pivot controls.
- Assert evidence graph/timeline empty/loading/error messaging hooks.
- Assert keyboard focus hooks for all new action clusters.

## Non-Goals

- Pure visual refresh with no workflow value.
- Animation-only enhancements that do not improve operator comprehension.
- Rewriting existing stable components without an expansion requirement.

## Exit Criteria for UI Portion of v1.5.0

- Expansion workflow acceptance scenarios are documented and pass.
- `npm run verify:ui` includes coverage for new critical operator states.
- UI defects that can mislead operator outcomes are closed before release tagging.
