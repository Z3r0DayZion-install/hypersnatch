# Queue and Scheduler Architecture

## Scope

Defines the architecture for queue lifecycle management and scheduler execution flow used by operator and automation workflows.

## Components

1. Decode Queue (`src/automation/decodeQueue.js`)
- Owns job model, lifecycle state, observability fields, and history
- Records action logs and reason context
- Produces queue/history snapshots and metrics

2. Decode Scheduler (`src/automation/decodeScheduler.js`)
- Pulls runnable jobs
- Coordinates execution and finalize/fail paths
- Emits run-time state transitions

3. Main IPC Bridge (`src/main.js`)
- Exposes queue add/action/bind-case/get-state handlers
- Bridges scheduler events to UI subscribers

## Job State Model

Supported lifecycle states:

- queued
- running
- paused
- manual-review
- completed
- warning
- failed
- canceled

## Observability Model

Per-job observability includes:

- added/start/finish timestamps
- duration
- retry and attempt counters
- source label
- failure reason / manual-review reason
- action log / last action

## Design Invariants

- state transitions are explicit and auditable
- risk outcomes are preserved, not normalized away
- UI/report consumers rely on deterministic field names

## Failure Handling

- failed and canceled are terminal states with explicit reason context
- warning and manual-review remain first-class operational outcomes
- requeue is explicit operator action, not silent retry loops
