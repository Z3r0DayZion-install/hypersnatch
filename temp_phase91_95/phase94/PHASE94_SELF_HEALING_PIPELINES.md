# Phase 94 – Self-Healing Investigation Pipelines

## Goal
Allow the system to recover from common investigation pipeline failures in a controlled, logged way.

## Capabilities
- retry failed stages
- fallback parser selection
- degraded-mode execution
- recovery planning
- repair audit logging

## Core modules
src/healing/
  selfHealingOrchestrator.js
  fallbackPlanner.js
  recoveryAudit.js
  degradedModeEngine.js

## New artifacts
- recovery_plan.json
- recovery_audit.json
- degraded_execution.json
