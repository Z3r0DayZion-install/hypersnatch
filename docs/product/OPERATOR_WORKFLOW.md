# Operator Workflow

## Workflow Objective

Provide a clear, truthful, end-to-end operator flow from intake through case-linked reporting/export.

## End-to-End Flow

1. Intake
- Operator submits single target or batch targets
- Input is parsed and routed to decode queue

2. Queue
- Jobs enter explicit lifecycle states
- Operator can pause, resume, cancel, manual-review, and requeue

3. Triage
- Operator reviews per-job status, timing, retries, and reason signals
- Warning/failed/manual-review states are surfaced explicitly

4. Case linkage
- Jobs can be linked to a case at queue time or from history
- Linked jobs become visible in case workspace depth panel

5. Trust assessment
- Case-level rollup summarizes risk and readiness
- Reason chains and timeline/lineage context provide explainability

6. Reporting
- Structured report sections summarize workflow state and outcomes
- Report includes risk sections and timeline/lineage context

7. Export
- Operator exports report and case data with deterministic metadata
- Export outputs support human briefing and machine processing

## Truthfulness Rules

- Success messaging is only shown when state supports it.
- Risk states must remain explicit: warning, failed, canceled, manual-review.
- Incomplete workflow is never presented as complete success.

## Review Readiness Criteria

The workflow is considered review-ready when:

- queue lifecycle + controls are functional
- observability/failure intelligence is present
- case workspace depth is functional
- structured reporting + lineage sections are present
- proof gates pass
