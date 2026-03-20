# HyperSnatch Capability Overview

## Product Intent

HyperSnatch is an operator-focused forensic workflow system for lawful media/evidence analysis, case organization, trust assessment, and report/export production.

## Core Capability Pillars

1. Intake and queue orchestration
- Single and batch intake
- Queue lifecycle controls: queued, running, paused, manual-review, completed, warning, failed, canceled
- Operator-driven requeue and case binding controls

2. Evidence intelligence and observability
- Per-job timing, retries, source labels, failure/manual-review reasons
- Action logs and reason chains for job state transitions
- Timeline-ready event records for operational visibility

3. Case workspace depth
- Case summary card and status rollup
- Linked queue activity in case context
- Case-context actions to open queue, generate report, and export

4. Trust and lineage
- Deterministic case trust rollup from linked job state
- Job and case timeline synthesis
- Deterministic lineage summary and reason-chain surfaces

5. Reporting and export
- Structured deterministic report sections
- Explicit risk sections for warning/failed/manual-review states
- Human and machine outputs (Markdown + JSON)

6. Verification and release discipline
- UI proof gates (`verify:ui`) tied to real workflow hooks
- Reproducible gate chain for branch and release readiness
- Audit-aware packaging and proof documentation

## Defensibility Signals

- Coherent operator workflow from intake to export
- Deterministic state/reporting structure
- Explicit trust and lineage model
- Testable UI contract and repeatable release proof chain

## Boundary Statement

HyperSnatch is positioned as a lawful forensic workflow and evidence analysis tool.
It is not positioned as bypassware, unauthorized access tooling, or piracy tooling.
