# HyperSnatch: AI Agent Operational Protocol v1.2.1

This document codifies the mandatory standards and workflows for any AI agent interacting with the HyperSnatch repository. **Adherence is required to maintain Institutional/Sovereign tier certification.**

---

## 1. Core Constraints

### 🔒 Offline-First Integrity
- **Criterion**: `verify.ps1` and core forensic modules MUST NOT make network calls.
- **Enforcement**: Verification depends solely on the embedded `hash_manifest.json`.

### 📦 Strict Determinism
- **Criterion**: Any modification to the build system (`release.yml`, `package.json`, `cargo.toml`) must maintain bit-for-bit reproducibility.
- **Validation**: Check hashes of built artifacts against previous builds where applicable.

---

## 2. Verification Standards

### PowerShell Verifier (`verify.ps1`)
- **Primary Platform**: Windows.
- **Mandatory Flag**: `-SelfTest` must be run after any script modification.
- **Exit Codes**:
    - `0`: Verified – binary is authentic
    - `1`: File not found
    - `2`: Hash mismatch – **DO NOT RUN**
    - `3`: Manifest error
    - `4`: Permission error
    - `5`: Self-test failed

---

## 3. Workflow Protocol

1.  **Status Check**: Review `MASTER_PROOF_v1.2.1.md` before any changes.
2.  **Roadmap Alignment**: Ensure changes align with `ROADMAP.md` (e.g., GPG/HSM targets).
3.  **Safety First**: Never propose network-dependent fallbacks.
4.  **Proof Generation**: Create or update `MASTER_PROOF_vX.Y.Z.md` upon reaching major milestones.
5.  **Linting**: All code must pass `npm run lint` and `Invoke-ScriptAnalyzer`.

---

## 4. Interaction Guidelines

- **Conciseness**: Be precise. Avoid fluff.
- **Evidence-Based**: Provide full file content or clear diffs.
- **Deterministic Handover**: When concluding a session, summarize the cryptographic state and next roadmap targets.

---
*© 2026 HyperSnatch Institutional. Verify before trust.*
