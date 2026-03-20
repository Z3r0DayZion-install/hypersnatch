# Case Linkage Architecture

## Scope

Defines how queue and history outcomes are linked into case context for workspace depth, trust rollup, and report/export flow.

## Components

1. Case Store (`src/cases/caseStore.js`)
- Persists case metadata and content

2. Notes and Findings
- `src/cases/caseNotes.js`
- `src/cases/findingsRegistry.js`

3. Queue Bind Path
- IPC handler `automation-queue-bind-case` in `src/main.js`
- Queue-level case linkage in `src/automation/decodeQueue.js`

4. UI Case Manager
- Case load/refresh and workspace rendering in `ui/hypersnatch-ui.html`

## Linkage Flows

1. Direct queue-to-case binding
- Intake can bind jobs to active case

2. History-to-case creation
- Operator can create case from history job and back-link queue history

3. Event-based case updates
- Automation completion events can attach findings to active case context

## Case Workspace Depth Contract

Case workspace depends on linked queue jobs to compute:

- case status rollup
- trust summary
- linked job list
- timeline/lineage summary
- case-context report and export actions

## Design Invariants

- case linkage is explicit (`caseId`) and preserved across queue/history
- linked state is readable in both UI and reports
- case context never hides warning/failed/manual-review states
