# Architecture

> Trust chain from developer commit to user verification.

## Trust Chain Diagram

```
┌────────────┐     ┌─────────────────┐     ┌────────────────────┐
│  Developer │────>│   Git Commit    │────>│   CI Build         │
│  (signed)  │     │   (tagged v*)   │     │   (GitHub Actions) │
└────────────┘     └─────────────────┘     └────────────────────┘
                                                    │
                         ┌──────────────────────────┤
                         ▼                          ▼
                ┌─────────────────┐     ┌────────────────────┐
                │  Hash Generation│     │  Manifest Signing  │
                │  (SHA-256)      │     │  (Ed25519)         │
                └────────┬────────┘     └────────┬───────────┘
                         │                       │
                         ▼                       ▼
                ┌─────────────────┐     ┌────────────────────┐
                │  Sigstore Sign  │     │  SLSA Provenance   │
                │  (cosign)       │     │  (provenance.json) │
                └────────┬────────┘     └────────┬───────────┘
                         │                       │
                         └───────────┬───────────┘
                                     ▼
                         ┌───────────────────────┐
                         │  Transparency Log     │
                         │  (append-only)        │
                         └───────────┬───────────┘
                                     ▼
                         ┌───────────────────────┐
                         │  GitHub Release        │
                         │  (artifact + verify    │
                         │   kit published)       │
                         └───────────┬───────────┘
                                     ▼
                         ┌───────────────────────┐
                         │  User Verification     │
                         │  verify.ps1 or         │
                         │  verify_node.js        │
                         └───────────────────────┘
```

## Components

| Component | File | Purpose |
|---|---|---|
| CI Pipeline | `.github/workflows/release.yml` | Orchestrates build, sign, verify, publish |
| Manifest Generator | `scripts/generate_manifest.cjs` | SHA-256 hashes for all build artifacts |
| Manifest Signer | `scripts/sign_manifest.cjs` | Ed25519 detached signature on MANIFEST.json |
| PowerShell Verifier | `scripts/verify.ps1` | Offline hash verification for Windows users |
| Node.js Verifier | `scripts/verify_node.js` | Cross-platform signature + hash verification |
| Reproducible Build | `scripts/reproduce.ps1` | One-command local reproducibility check |
| Docker Build | `Dockerfile.repro` | Containerized deterministic build |
| Provenance | `release/provenance.json` | SLSA-compliant build attestation |
| Transparency Log | `release/transparency.log` | Append-only release audit trail |
| Verify Kit | `release/verify/` | Manifest, signature, public key, fingerprint |

## Verification Layers

```
Layer 1: Hash Verification
  artifact.exe → SHA-256 → compare against MANIFEST.json

Layer 2: Manifest Signature
  MANIFEST.json → Ed25519 verify → root_public_key.pem

Layer 3: Artifact Signature
  artifact.exe → cosign verify-blob → Sigstore transparency log

Layer 4: Provenance
  provenance.json → verify build metadata → CI runner + commit hash

Layer 5: Reproducibility
  source code → Dockerfile.repro → rebuild → compare hashes
```

## Key Storage

| Key | Location | Access |
|---|---|---|
| Ed25519 private key | `release/keys/signing_key.pem` | CI secrets only, never committed |
| Ed25519 public key | `release/verify/root_public_key.pem` | Public, committed to repo |
| Root fingerprint | `release/verify/ROOT_FINGERPRINT.txt` | Public, committed to repo |
| Sigstore certificates | Generated per-release by Fulcio | Ephemeral, attached to release |
