# Attack Surface Documentation

> Honest assessment of threats mitigated and NOT mitigated by the HyperSnatch architecture.

Security requires explicit boundaries. This document outlines exactly what the HyperSnatch distribution model protects against, and critically, where you must exercise your own operational security.

## ✅ Threats Mitigated

The current architecture provides verified cryptographic protection against the following vectors:

*   **Tampered Downloads (CDN/Mirror Compromise):** An attacker replacing the `.exe` on a download mirror will be caught by `verify.ps1`, `verify.sh`, and `verify_node.js` due to a SHA-256 hash mismatch.
*   **Manifest Forgery:** Modifying `MANIFEST.json` to reflect a malicious binary's hashes is prevented by the Ed25519 signature. The verifier will reject the forged manifest (`manifest.sig`).
*   **CI Pipeline Injection:** Malicious code injected into GitHub Actions during build time is detectable. The `provenance.json` attestation will fail to match the tagged source commit, and the `Dockerfile.repro` rebuild will diverge from the CI output.
*   **Supply Chain Poisoning (Dependencies):** The project explicitly utilizes `npm ci` strictly pinned to `package-lock.json`, enforcing exact sub-dependency trees. The minimal dependency graph (3 external runtime dependencies) radically shrinks the attack surface.
*   **Artifact Substitution / Silent Releases:** The `release/transparency.log` enforces an append-only, publicly auditable ledger of all releases. Sigstore/cosign keyless signatures link the published artifact directly to the CI execution context.
*   **Runtime Network Exfiltration:** The core `SmartDecode` engine is entirely offline. The Electron environment isolates the context (`contextIsolation: true`, `nodeIntegration: false`), and `security_hardening.js` enforces a strict Content Security Policy (CSP) blocking external navigation.

## ⛔ Threats NOT Mitigated

The distribution model *cannot* protect against the following scenarios. Users must handle these through local endpoint security, strict operational environments, and sandbox usage:

*   **Compromised Build Host (Developer Machine):** If the developer's local machine is compromised with a rootkit or compiler backdoor (e.g., XcodeGhost or xz-utils style supply chain attack) *before* the code is committed, the malicious code becomes the "canonical" source. `Dockerfile.repro` will faithfully reproduce the backdoored compiler output.
*   **Malicious Contributor Commit:** A seemingly benign PR merging an obfuscated backdoor into `main` is not caught by reproducible builds (because the build simply reproduces the backdoor). Code review is the only defense here.
*   **Compromised User OS:** If the user executes the verified binary on a machine already infected with an active rootkit or memory scraper, the binary's integrity is irrelevant at runtime.
*   **Compromised Verifier Execution Strategy:** If an attacker modifies the *verifier script itself* locally before the user runs it, all bets are off. The user must download the verifier securely and run it from a trusted path.
*   **SmartScreen / Defender False Positives:** The project relies on cryptographic verification, not reputation. Because HyperSnatch lacks an EV code-signing certificate (which requires paying thousands of dollars and submitting enterprise KYC), Windows SmartScreen will flag the executable. The user must trust the offline hash verification over Microsoft's reputation heuristics.
*   **Side-Channel Attacks:** Advanced memory analysis or timing attacks against the running Electron process are completely out of scope for the distribution model.
