# Audit WARN Policy Plan v1.5.5

Date: 2026-03-20  
Branch: `release-readiness/v1.5.5-hardening`

## Goal

Reduce dependence on operator memory/discipline when distinguishing WARN-mode evidence from strict stable signoff.

## Focus Areas

1. Tighten default WARN interpretation messaging in `audit:final`.
2. Make strict stable signoff path explicit, prominent, and difficult to skip.
3. Clarify when WARN-mode runs are acceptable and when they are not.
4. Keep policy guidance aligned across scripts and release docs.

## Planned Work Items

1. Tighten warning language and signoff interpretation in `tests/final_sovereign_audit.js`.
2. Improve strict rerun guidance wording and command examples.
3. Align release/gate docs with final WARN/strict contract.
4. Record progress and gate impact in `docs/release/V1_5_5_HARDENING_PROGRESS.md`.

## Exit Criteria

1. WARN output cannot be reasonably read as strict stable signoff.
2. Strict rerun path is explicit and copy/paste ready.
3. Policy language is consistent across audit output and proof docs.
