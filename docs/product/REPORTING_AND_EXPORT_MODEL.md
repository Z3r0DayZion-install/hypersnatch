# HyperSnatch Reporting and Export Model

## Purpose

HyperSnatch reporting converts operator workflow state into deterministic, reviewable output for lawful forensic analysis and evidence organization.

## Report Types

1. Operator Workflow Report (batch/queue context)
2. Case Workspace Report (active case context)

Both report types provide:

- executive summary
- queue results summary
- case summary
- trust summary
- warnings/failures/manual-review section
- evidence timeline and lineage section
- export metadata

## Deterministic Structure

Report headings and section names are fixed to support reproducible parsing and review:

- `Executive Summary`
- `Queue Results Summary`
- `Case Summary`
- `Trust Summary`
- `Warnings Failures and Manual Review`
- `Evidence Timeline and Lineage`
- `Export Metadata`

## Export Variants

Reports are exported in two operator-usable formats:

1. Markdown (`.md`) for human briefings
2. JSON (`.json`) for tooling and audit workflows

## Truthfulness Rules

Reports must never claim success when state indicates risk.

Allowed operational statuses:

- `completed`
- `warning`
- `failed`
- `canceled`
- `manual-review`
- in-progress states (`queued`, `running`, `paused`)

## Positioning Boundary

This reporting layer is designed for lawful forensic workflow, evidence tracking, and case communication.
It is not positioned as bypassware or unauthorized access tooling.
