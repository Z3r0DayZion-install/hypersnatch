# NeuralCache-Core v1.0.0: Reproducibility Protocol

This document provides the instructions required to independently verify the cryptographic integrity and deterministic build of the NeuralCache-Core v1.0.0 kernel.

## 1. Environment Setup
- **Rust**: Install version 1.75.0 (pinned in `rust-toolchain.toml`).
- **Node.js**: Version 18.0.0 or higher.
- **Git**: Required for spec-lock verification.

## 2. Verification Steps

### A. Artifact Hash Comparison
Run the following command to compare your local file hashes against the recorded artifacts:
```bash
node scripts/gen-hashes.js
diff release-proof/EXPECTED_HASHES.txt (generated_output)
```
The hashes for `src/core/neuralcache-core.js` and `rust/hs-core/src/main.rs` must match exactly.

### B. Deterministic Rust Build
1. Navigate to `rust/hs-core/`.
2. Run `cargo build --release --locked`.
3. Verify the binary `hs-core.exe` hash (if applicable for your platform).

### C. CI Spec-Lock Test
To verify that the spec-lock drift gates are active:
1. Modify `docs/security/CRYPTOGRAPHIC_ARCHITECTURE_SPEC.md` without a version bump.
2. Run `node scripts/ci-integrity.js`.
3. The command **must fail** with a drift detection error.

## 3. Trust Boundary Enforcement
The NeuralCache-Core v1.0.0 is strictly isolated. All cryptographic operations occur within the core; the Electron/UI layers handle no secret material.
