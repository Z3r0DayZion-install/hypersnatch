# HyperSnatch Trust and Lineage Model

## Purpose

The trust and lineage model explains why an operator should trust a result, what happened during processing, and what requires manual review.

## Core Inputs

Trust and lineage are derived from queue and case workflow state, including:

- lifecycle status
- timestamps (`added`, `started`, `finished`)
- retry/attempt counters
- source labels
- failure/manual-review reasons
- action log entries

## Lineage Layers

1. Job timeline
   - ordered lifecycle and action events for each job
2. Case timeline
   - merged, time-ordered events across all jobs linked to a case
3. Reason chain
   - deterministic chain of failure/manual-review causes and action details

## Trust Rollup

Case trust summary is computed from linked job state:

- critical failures -> `Critical failures detected`
- warnings/manual-review/canceled -> `Manual review required`
- completed with no active queue risk -> `Stable and completed`
- otherwise -> `In progress`

## Operator Value

This model supports:

- rapid triage under pressure
- clear handoff to another analyst
- explicit proof context in report exports
- reduced ambiguity during audit/review

## Boundaries

Trust and lineage indicate workflow confidence and evidence handling state.
They do not assert legal conclusions or guarantee evidentiary admissibility without analyst review.
