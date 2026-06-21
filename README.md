# HyperSnatch

**Offline evidence and stream intelligence workstation.**  
Decode, organize, sign, verify, and seal investigation artifacts — locally, with cryptographic proof at every step.

[![Release](https://img.shields.io/badge/release-v1.6.6-brightgreen)](https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.6)
[![Tests](https://img.shields.io/badge/E2E%20tests-93%2F93-brightgreen)](#)
[![Platform](https://img.shields.io/badge/platform-Windows-blue)](#)

---

## Download

**[HyperSnatch-Setup-1.6.6.exe](https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.6)** — Windows installer  
**[HyperSnatch_Vanguard_v1.6.6.zip](https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.6)** — Portable zip

SHA256 hashes in [`docs/release/RELEASE_PROOF_v1.6.6.md`](docs/release/RELEASE_PROOF_v1.6.6.md).

---

## What it does

- **Decode & capture** — pull and store evidence bundles from streams and URLs
- **Investigate** — build cases, log findings, attach bundles, run comparisons
- **Sign & seal** — cryptographically sign evidence, seal packages, generate chain-of-custody
- **Graph & analyze** — map infrastructure topology, find hot nodes, bridges, and cross-case correlations
- **Trust registry** — track and verify intelligence sources
- **Workspace management** — assign cases to analysts, manage teams
- **Policy engine** — enforce export/redact/seal rules at the operator level
- **Local-first** — no cloud dependency, no external calls during investigation

Everything is stored as a verifiable `.hsn` capsule. Hashes are recorded at every stage.

---

## Proof

Every release ships with a signed proof record:

- `release:gate` must pass before any tag is created
- Installer and zip SHA256 hashes are recorded in `docs/release/RELEASE_PROOF_vX.Y.Z.md`
- 93 E2E Playwright tests cover the full operator UI surface

---

## Build from source

```powershell
npm install
npm run dist
```

Requires Node.js 18+ and Windows (Electron build target).

---

## Verify a download

```powershell
Get-FileHash .\HyperSnatch-Setup-1.6.6.exe -Algorithm SHA256
```

Compare against `docs/release/RELEASE_PROOF_v1.6.6.md`.

---

## Release history

| Version | Codename | Notes |
|---------|----------|-------|
| v1.6.6 | Insane Mode | caseUpdateFinding wired, policyAudit fix, 93 E2E tests |
| v1.6.5 | Insane Mode | wsAssignCase wired, withLoading on all async buttons |
| v1.6.4 | — | UI polish pass, pill-btn system, input-field system |
| v1.6.3 | — | Full IPC surface wiring (ws/trust/review/redact/graph/replay) |

Full changelog: [releases](https://github.com/Z3r0DayZion-install/hypersnatch/releases)
