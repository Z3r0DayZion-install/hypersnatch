# NeuralCache-Core: Institutional Brief (v1.0.0)

## 1. Executive Summary
NeuralCache-Core is a deterministic cryptographic knowledge kernel designed for offline-first forensic integrity. It serves as an isolated substrate for high-stakes evidence analysis, ensuring that all data transformations and integrity seals are governed by immutable, version-bound protocols rather than transient application state.

## 2. Mechanical Operation
The core operates as a strictly decoupled black-box kernel with the following mechanical invariants:

- **Isolated Key Derivation**: Master keys are derived via PBKDF2-SHA256 (100k iterations) and remain locked within the core’s memory space. Raw secret material never traverses the application layer.
- **Envelope Encryption**: All forensic records are sealed in AES-256-GCM envelopes. Authenticated Additional Data (AAD) is used to bind each record to a specific cryptographic epoch, preventing cross-epoch data contamination.
- **Hardware-Bound Identity**: Local integrity seals (Sovereign Seals) are derived directly from machine-unique hardware identifiers (CPU ID/Baseboard ID). This ensures that forensic bundles are non-transferable and machine-attested.
- **Deterministic Integrity**: Manifest generation and Merkle-root placeholders ensure that evidence sets are cryptographically verifiable and resistant to tampering or deletion.
- **CI Drift Gates**: Any modification to the core cryptographic specifications or schema without a corresponding version bump triggers an immediate CI failure, preventing silent security regressions.

## 3. Scope of Claims (Non-Claims)
Institutional buyers and auditors should note the following constraints:

- **Not a Password Manager**: NeuralCache-Core does not provide long-term credential storage; it manages transient session material for forensic sessions.
- **No Network Connectivity**: The core is network-agnostic. It does not handle key exchange or remote attestation; these are responsibilities of the higher-level "Empire" infrastructure.
- **No Obfuscation-Based Security**: Trust is derived from mathematical invariants and deterministic build reproducibility, not from code obfuscation or proprietary secrecy.
- **Deterministic, Not Infallible**: While the core prevents structural tampering, the security of the kernel is dependent on the host environment's memory isolation and the user's passphrase entropy.
