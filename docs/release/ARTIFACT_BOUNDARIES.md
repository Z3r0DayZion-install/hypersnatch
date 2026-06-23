# Artifact Boundaries

Date: March 19, 2026

## Purpose

Define what is code, what is documentation, and what is generated output so release proof and audits remain trustworthy.

## Boundary Rules

1. Tracked source code and docs are the only canonical editable assets.
2. Generated artifacts are reproducible outputs and must not be edited manually.
3. Release records must cite immutable references (tag SHA, commit SHA, artifact hash).
4. Release verification must be run from a clean worktree anchored to merged head.

## Canonical Editable Assets

- `src/`, `core/`, `ui/`, `tests/`, `scripts/`, `docs/`, `config/`

## Non-Canonical Generated Assets

- `dist/`, `build/`, `out/`, `coverage/`, `logs/`, `release/`
- binary outputs (`*.exe`, generated `*.zip`)

## Handling Rules

- Generated assets may be produced locally for proof and packaging.
- Generated assets are not PR review surface unless the PR explicitly targets packaging mechanics.
- Release digests and metadata belong in docs and release notes, not in mutable binaries.

## Exceptions

- If a generated artifact must be preserved for audit or customer distribution, publish it as a release asset and record hash in `docs/release/`.
