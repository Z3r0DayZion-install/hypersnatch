# Path Governance

Date: March 19, 2026

## Source of Truth Paths (Manual Edits Allowed)

- `src/` application runtime code
- `core/` shared core modules
- `ui/` operator interface source
- `tests/` deterministic test suites and fixtures
- `scripts/` build, verification, and automation scripts
- `docs/` project documentation
- `config/` tracked runtime configuration defaults

## Generated Output Paths (Do Not Hand-Edit)

- `dist/` electron build output and packaged binaries
- `build/` build resources and generated helper binaries
- `out/` build output staging
- `coverage/` test coverage reports
- `logs/` runtime/build logs
- `release/` generated release bundles and handoff artifacts

## Forensic and Release Proof Records

- `docs/release/` release proof and operator governance docs
- `docs/security/` release/security checklist and policy docs
- Tag references (remote truth):
  - release tag `v1.3.1`
  - snapshot tag `audit/snapshot-2026-03-19-head`

## Archival Material

- `docs/archive/` historical docs kept for context and traceability
- `docs/sovereign_archive/` historical snapshot materials

Archive content is read-only context unless a dedicated archival migration PR explicitly says otherwise.
