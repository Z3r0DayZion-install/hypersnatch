# Post-Release Repo Hygiene Track

Date opened: March 19, 2026
Branch: `post-release/repo-hygiene`

## Problem Statement

The primary local `main` worktree is not a clean release-proof environment. It contains extensive local drift (tracked deletions, untracked additions, and local ahead commits) unrelated to `v1.3.1` release verification.

## Guardrails

- Do not mutate or retag `v1.3.1`.
- Keep release-line work isolated from archive/migration cleanup.
- Run cleanup work only in dedicated post-release branches.
- Preserve forensic references:
  - release commit `5be07df6cb1f966bc79565124d1b046c73f6ad7b`
  - release tag `v1.3.1`
  - snapshot tag `audit/snapshot-2026-03-19-head`

## Cleanup Scope

- Inventory local-only branches and commits in the dirty worktree.
- Classify changes into:
  - archival content migration
  - obsolete generated artifacts
  - valid feature work to port forward
  - deletions requiring recovery or permanent retirement
- Move keep-worthy work into reviewable branches and PRs.
- Remove dead/stale files only through traceable commits.

## Exit Criteria

- Primary `main` worktree can be reset to a clean state without data loss.
- Any retained post-release work is preserved in explicit branches/PRs.
- No unresolved local-only release-impacting drift remains.
