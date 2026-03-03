# Threat Model

HyperSnatch ships unsigned Windows binaries using a detached verification model. This document defines the threat surface, trust boundaries, and mitigations.

## Protected Assets

1. **Binary Integrity** — The distributed `.exe` exactly matches the source code built by the CI pipeline.
2. **Offline Trust** — Users can verify the binary without relying on external network calls or Certificate Authorities.

## Trust Boundaries

| In Scope | Out of Scope |
|----------|-------------|
| Malicious modification of the hosted binary | Local host compromise (malware on the verifying machine) |
| Transit MITM attacks on downloads | Electron framework 0-days |
| Unauthorized repacking of the installer | Vulnerabilities in OS-level hardware abstractions |

## Threat Scenarios

### 1. Supply-Chain Tampering (Release Asset Replacement)
**Threat**: Attacker gains write access to GitHub Releases and replaces the `.exe` with a backdoored version.

**Mitigation**:
- `verify.ps1` computes the SHA-256 hash locally and compares it against `SHA256SUMS.txt`.
- Any modification to the binary without updating the hash manifest results in immediate verification failure.
- **Limitation**: If the attacker also controls the repository and modifies `SHA256SUMS.txt`, the user must have obtained the root public key / expected hash out-of-band (e.g., from a separate signed tweet or personal website).

### 2. CI/CD Compromise (Build-Time Injection)
**Threat**: The GitHub Actions build environment is compromised and malicious code is injected before the binary is hashed.

**Mitigation**:
- The build is designed to be deterministic (see [REPRODUCIBILITY.md](REPRODUCIBILITY.md)).
- Any third party can clone the exact release tag, run `npm ci && npm run build:win`, and compare the resulting SHA-256 hash against the published value.
- The CI pipeline does **not** hold root signing keys. Root keys remain offline.

### 3. Key Compromise (Private Key Exposure)
**Threat**: The Ed25519 private key used to sign manifests or commits is exposed.

**Mitigation**:
- Sub-key delegation is practiced — release signing uses a distinct key from daily commit signing.
- In the event of compromise, a revocation notice is published across multiple independent channels (GitHub, personal site, HN post) simultaneously to establish the new root of trust.

### 4. SmartScreen Friction (Adversarial OS UI)
**Threat**: Windows SmartScreen labels the unsigned binary as "unrecognized," training users to bypass warnings for all software rather than only verified software.

**Mitigation**:
- This model explicitly targets technical users who understand the distinction.
- Running `verify.ps1` before executing the binary shifts the trust decision from opaque OS heuristics to explicit cryptographic verification. The SmartScreen dialog occurs *after* the user has already established their own chain of trust.

### 5. User Error (Bypassing Verification)
**Threat**: A non-technical user downloads and runs the binary directly without running `verify.ps1`.

**Mitigation**:
- **Accepted risk.** This model relies on an opt-in trust contract.
- README, releases page, and installer UI all contain prominent verification reminders.
- Long-term: shell wrapper or NSIS pre-install check that prompts for hash verification.

## What We Are Not Protecting Against

- A fully compromised developer workstation at signing time
- A malicious insider with repository write access who controls *both* the binary and the hash manifest simultaneously and also controls the out-of-band channels used for fingerprint publication
- Quantum attacks on Ed25519 (out of scope for present threat horizon)
