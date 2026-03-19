# Phase 79 – Policy Engine

## Goal
Allow institutions to define deterministic rules for automation, sharing, replay, exports, and plugins.

## New capabilities
- workspace policy evaluation
- export control policies
- replay permission policies
- plugin allow/deny policies
- autonomous action guardrails

## Core modules
src/policy/
  policyEngine.js
  policyLoader.js
  policyEvaluator.js
  policyAudit.js
  policyTemplates.js

## New artifacts
- policy_decisions.json
- policy_audit.json
- active_policies.json

## Example policy
IF workspace_mode = "airgap"
THEN deny remote exchange
REASON "airgap policy"
