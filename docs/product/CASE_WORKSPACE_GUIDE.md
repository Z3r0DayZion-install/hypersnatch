# Case Workspace Guide

## Purpose

The case workspace is the operator control surface for converting queue outcomes into case-level evidence context and actionable reporting/export.

## Workspace Components

1. Case summary and trust rollup
- Bundles/notes/findings counters
- Case-level queue status rollup
- Trust summary derived from linked job state

2. Linked queue activity
- Recent case-linked jobs
- Per-job status, timing, source, retries, reason chain, last action
- Open queue and reopen controls from case context

3. Evidence timeline and lineage
- Case lineage summary string
- Case timeline event feed (time-ordered)
- Visibility into failure/manual-review reason chain

4. Case context actions
- Open queue view
- Open case report
- Export case report (Markdown + JSON)
- Export active case

## State Semantics

- Empty state: no linked queue jobs for case
- Loading state: automation state synchronization in progress
- Error state: automation bridge/state unavailable
- Success/in-progress/risk states: reflected in trust and rollups

## Recommended Operator Use

1. Load case.
2. Review linked queue activity and trust rollup.
3. Resolve manual-review/warning/failed items.
4. Generate case report from context.
5. Export report and case data.

## Non-Goals

- Decorative dashboard widgets without workflow value
- Ambiguous status language
- Hidden failure or manual-review conditions
