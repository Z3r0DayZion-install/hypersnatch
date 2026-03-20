# Dependency Hygiene Plan v1.5.1

Date: 2026-03-20
Branch: `release-readiness/v1.5.1-hardening`

## Objective
Improve dependency trust and reproducibility confidence in the maintenance line without triggering risky expansion.

## Inputs
- post-release audit findings on setup-time warnings
- clean-worktree reproducibility behavior
- current lockfile and build tooling constraints

## Work Items

### 1. Warning Inventory
- capture current install-time warnings by package and reason
- classify each warning: informational, medium risk, action required

### 2. Maintenance-Safe Action Rules
- only adopt updates compatible with current maintenance baseline
- avoid large dependency jumps that introduce feature risk
- prioritize changes that reduce security/support ambiguity

### 3. Proof and Documentation Alignment
- ensure setup notes reflect actual dependency prerequisites
- ensure gate order remains explicit and reproducible
- record rationale for any warning left as observation-only

## Exit Criteria
- maintainers have a clear warning inventory and action rationale
- dependency hygiene decisions are documented and reviewable
- full gate set remains green after any approved dependency adjustments

## Execution Status

- `scripts/verify_release.js` now includes runtime/dependency preflight checks:
  - lockfile presence
  - node engine minimum-baseline enforcement on Node 20 line
  - local `electron` and `electron-builder` presence with remediation hints
- dependency warning inventory captured in:
  - `docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.1.md`
- clean-worktree setup notes updated with dependency hygiene workflow and classification rules

## Non-Goals
- no broad dependency modernization campaign
- no architecture refactors
- no unrelated cleanup
