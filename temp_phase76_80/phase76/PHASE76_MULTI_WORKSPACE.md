# Phase 76 – Multi-Workspace / Team Operations

## Goal
Support multiple workspaces, teams, and analyst roles without collapsing evidence boundaries.

## New capabilities
- multiple workspaces
- workspace-level settings
- analyst identity / role association
- shared vs private cases
- reviewer assignment
- workspace activity feeds

## Core modules
src/workspaces/
  workspaceStore.js
  workspaceMembers.js
  workspaceCases.js
  roleRegistry.js
  activityFeed.js

## New artifacts
- workspace.json
- workspace_members.json
- workspace_activity.json
- case_assignment.json

## UI panels
- WorkspacePanel
- TeamPanel
- ActivityFeedPanel
- AssignmentPanel
