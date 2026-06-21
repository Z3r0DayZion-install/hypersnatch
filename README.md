# HyperSnatch v1.6.5

**STATUS**: Active expansion (`v1.6.5` — Insane Mode)  
**CURRENT LANE**: `feat/v1.6.x-expansion` — all IPC surfaces wired, 73/73 E2E tests passing  
**LATEST PROOF RECORD**: `docs/release/RELEASE_PROOF_v1.6.5.md`  
**LATEST REALITY AUDIT**: `docs/PROJECT_STATUS.md`  
**STATE**: v1.6.x deep-wiring + UI polish complete; wsAssignCase wired; `withLoading` on all async buttons; tests 52–70 added

## Release-Readiness Truth Boundary

Use these docs as the current support/truth boundary for release-readiness claims:

- `docs/release/V1_5_10_SETUP_TRUTH_MATRIX.md`
- `docs/release/V1_5_10_ENVIRONMENT_ASSUMPTIONS.md`
- `docs/release/V1_5_10_CLAIM_TO_PROOF_MAP.md`
- `docs/release/V1_5_10_GOVERNANCE_GAPS.md`
- `docs/dev/WORKTREE_SETUP_NOTES.md`
- `docs/release/CLEAN_WORKTREE_RELEASE_FLOW.md`

Signoff interpretation:

- `npm run audit:final` is maintenance evidence only (`NON-SIGNOFF`).
- `npm run audit:stable` is the strict stable signoff path (`APPROVED` required for stable tag/release).

## Stewardship & Onboarding
- **ARCHIVE_RECORD.md**: Immediate verification summary
- **BUILD_ENVIRONMENT.md**: Runtime requirements
- **docs/agent/**: Onboarding guide for future AI coding agents
- **docs/ultimate/**: HyperSnatch v2 strategic roadmap
- **docs/v2_godmode/**: Definitive GodMode v2 development blueprints
- **docs/v2_ultimate_devkit/**: Complete v2 repository skeleton and DevKit
- **docs/v2_godmode_devpack/**: Autonomous build kit for AI coding agents
- **CAPSULE_SCHEMA.md**: Sealed .hsn structure definition

## Overview
This pack contains the main pieces that were still missing from `HyperSnatch_Master_Dev_Pack_v2`.

Included:
- `AGENT_BOOT_PROMPT.md`
- `REPO_FILE_TREE.md`
- `UI_STYLE_GUIDE.md`
- `NEURAL_EMPIRE_INTEGRATION.md`
- `MODULE_CONTRACTS.md`
- `ACCEPTANCE_CRITERIA.md`
- `IMPLEMENTATION_GUARDRAILS.md`

Purpose:
Turn v2 from a strong build pack into a stricter autonomous execution pack with:
- a fixed repo structure
- a high-quality GUI style system
- exact module boundaries
- integration into the wider NeuralEmpire ecosystem
- clearer success/fail conditions for agents

## Institutional Summary
HyperSnatch is an offline investigation platform that stores investigations as cryptographically verifiable capsules and automatically identifies connections between cases through infrastructure, entity, and narrative analysis.

## Future Expansion Rules
1. **Core Immobility**: Never modify the `src/` core or `CAPSULE_SCHEMA.md`.
2. **Plugin Expansion**: All new features must be implemented as separate plugins via the v2 API.
3. **Deterministic Verification**: All changes must pass the capstone `scripts/verify_system.js`.
