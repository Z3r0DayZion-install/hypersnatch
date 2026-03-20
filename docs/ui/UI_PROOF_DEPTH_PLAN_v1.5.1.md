# UI Proof Depth Plan v1.5.1

Date: 2026-03-20
Branch: `release-readiness/v1.5.1-hardening`

## Objective
Increase confidence in UI state truth without changing UI feature scope or design language.

## Current Gap
Current `verify:ui` confirms critical hooks and baseline shell presence. It does not fully assert deeper operational state transitions.

## Planned Strengthening

### A. State Truth Assertions
Add checks for clear presence/handling of:
- warning states
- failed states
- manual-review states
- canceled states where applicable

### B. Flow Consistency Assertions
Add checks that ensure:
- queue-to-case linkage remains represented in UI hooks
- report sections remain tied to actual state labels
- export paths remain clearly wired from case/report contexts

### C. Regression Guards
Add stable guards for:
- deterministic version fallback usage
- key trust/report panel anchors
- state-labeled output sections used in review summaries

## Non-Goals
- no new UI panels
- no styling redesign
- no layout experimentation

## Acceptance
- `npm run verify:ui` covers expanded state-truth checks
- no regressions in existing gate suite
- resulting checks remain deterministic in clean worktrees
