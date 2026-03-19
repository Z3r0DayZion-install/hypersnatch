# Architectural Rules for Phases 76–80

## 1. Workspace separation is strict
Cases, findings, and research queues must be isolated per workspace unless explicitly shared.

## 2. Federation is exchange, not remote control
Remote bundle exchange may sync or import signed artifacts.
It must never become silent remote execution.

## 3. Graph analytics must remain explainable
Centrality, clustering, and ranking outputs must include:
- metric used
- score
- source nodes / edges
- evidence summary

## 4. Policy engine decisions require reason chains
Any allow/deny/hold decision must emit:
- policy matched
- reason list
- evidence used
- timestamp
- actor / system source

## 5. Enterprise controls must support sovereign deployments
All controls must allow:
- offline-only mode
- air-gapped mode
- restricted plugin mode
- local signing-only mode

## 6. No automatic data egress
Sharing/export/sync must always be visible and logged.

## 7. Team features must preserve custody
Any transfer between workspaces or analysts must append to custody/audit artifacts.
