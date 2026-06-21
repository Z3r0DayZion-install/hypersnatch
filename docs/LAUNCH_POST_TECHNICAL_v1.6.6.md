# Technical Post — HyperSnatch v1.6.6

**Platform:** Reddit r/netsec, r/ReverseEngineering, or similar

**Title:** I built an offline evidence workstation that hashes everything — v1.6.6 just shipped

---

**Body:**

HyperSnatch is an Electron-based investigation workstation I've been building for about a year. The core idea: every piece of evidence has a hash. Every action on that evidence has a record. Nothing leaves your machine unless you export it explicitly.

**The proof model:**

Every release goes through a gate before tagging:
- `release:gate` runs preflight, E2E tests, and audit:stable
- The installer and zip get SHA256'd into a `RELEASE_PROOF` doc that ships in the repo
- You can verify any download with `Get-FileHash` before running it

The investigation artifacts are stored as `.hsn` capsules — sealed containers with embedded hashes for each evidence bundle, finding, and chain-of-custody event.

**What the UI covers (v1.6.6 — all IPC surfaces wired):**

- Evidence decode and bundle capture
- Case management: findings, notes, comparisons, audit log
- Evidence signing and sealed package export
- Infrastructure graph: hot node scoring, bridge detection, centrality
- Cross-case mining: finds shared infrastructure across separate investigations
- Trust registry: source verification and exchange logging
- Workspace management: analyst assignment, team feeds
- Policy engine: rule-based export/redact/seal enforcement
- Autonomous investigation assistant
- 93 E2E Playwright tests covering the full operator surface

**What I focused on in v1.6.6:**

The last real gap was `caseUpdateFinding` — the IPC method existed in the backend but had no UI surface. Also fixed a subtle bug where `policyAuditLog` was calling `log?.entries` on an array (which resolves to `Array.prototype.entries`, a function, truthy) instead of doing `Array.isArray` first — this caused the panel to silently render empty.

**Stack:** Electron 28, Node.js 18, Playwright for E2E, no frontend framework (vanilla JS in a single hardened HTML file). Windows only for now.

**Repo / release:**
https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.6

Open to questions on the capsule format, the graph model, or the release proof approach.
