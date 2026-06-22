# Technical Post — HyperSnatch v1.6.8

**Platform:** Reddit r/netsec, r/ReverseEngineering, or similar

**Title:** I built an offline evidence workstation that hashes everything — v1.6.8 just shipped (fresh-install launch fix)

---

**Body:**

HyperSnatch is an Electron-based investigation workstation. The core idea: every piece of evidence has a hash. Every action on that evidence has a record. Nothing leaves your machine unless you export it explicitly.

HyperSnatch is a Proof Foundry product for local-first evidence, stream intelligence, release proof, and artifact verification.

**The proof model:**

Every release goes through a gate before tagging:
- `release:gate` runs preflight, E2E tests, and audit:stable
- The installer gets SHA256'd into a `RELEASE_PROOF` doc that ships in the repo
- You can verify any download with `Get-FileHash` before running it

The investigation artifacts are stored as `.hsn` capsules — sealed containers with embedded hashes for each evidence bundle, finding, and chain-of-custody event.

**What the UI covers (v1.6.8 — all IPC surfaces wired):**

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

**What changed in the v1.6.6 → v1.6.8 hotfix chain:**

v1.6.6 passed gate but broke on fresh install. The hotfixes caught three real bugs:

1. `IntelligenceGraph` used at module scope without a `require` — Node threw before `app.whenReady()` fired
2. `BundleSigner.ensureKeyPair` called `crypto.generateKeyPairSync` with `secp256k1` — Electron ships BoringSSL, not OpenSSL; BoringSSL doesn't support that curve; replaced with `prime256v1`
3. `BrowserWindow` was created without `show: false`, and `executeJavaScript` was called before `loadFile`, corrupting `webContents` state and preventing `ready-to-show` from firing

All three were caught in pre-launch testing before the HN post. That's the system working.

**Stack:** Electron 28, Node.js 18, Playwright for E2E, no frontend framework (vanilla JS in a single hardened HTML file). Windows only for now.

**Repo / release:**
https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.8

Open to questions on the capsule format, the graph model, or the release proof approach.
