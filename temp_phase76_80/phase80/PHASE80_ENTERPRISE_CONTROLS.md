# Phase 80 – Enterprise Deployment Controls

## Goal
Add the control surface required for enterprise and sovereign deployments.

## New capabilities
- deployment profiles
- plugin mode restrictions
- workspace isolation profiles
- offline-only enforcement
- signing mode enforcement
- storage quotas / retention policies

## Core modules
src/enterprise/
  deploymentProfiles.js
  controlPlane.js
  retentionManager.js
  quotaManager.js
  restrictionManager.js

## New artifacts
- deployment_profile.json
- enterprise_control_state.json
- retention_report.json
- quota_report.json

## Profiles
- sovereign_airgap
- enterprise_offline
- research_lab
- plugin_restricted
- analyst_standard
