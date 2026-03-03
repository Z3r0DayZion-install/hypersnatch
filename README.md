# HyperSnatch

**An experimental Windows desktop application used to validate a detached verification distribution model built around reproducible builds, cryptographic manifests, and offline-first execution.**

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.2.0)
[![Platform](https://img.shields.io/badge/platform-Windows_10%2F11_x64-lightgrey)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

HyperSnatch is a functional payload (an offline media URL extractor) wrapped inside a zero-trust distribution mechanism. It ships completely unsigned — no EV certificate, no CA dependency — to test the viability of community-auditable hash verification on Windows.

---

## The Experiment

**Thesis**: For a technical user base, transparent offline verification provides higher trust guarantees and better supply-chain resilience than opaque certificate-based code signing.

Instead of paying for an EV certificate and relying on Microsoft's opaque SmartScreen telemetry, we provide:
1. A deterministic hash verifier (`verify.ps1`) — ~60 lines, zero dependencies
2. Public SHA-256 checksums mathematically bound to source
3. Full reproducible source code with documented build steps

### Architecture Overview

| Layer | Description |
|-------|-------------|
| **Dual Extraction Engine** | JavaScript (cross-platform regex) + Rust (`hs-core`) for large payloads |
| **Manifest Signing** | SHA-256 hashes embedded in `SHA256SUMS.txt`, Ed25519 root key model |
| **Detached Verifier** | `verify.ps1` — offline PowerShell script, no network calls |
| **Isolation** | Electron with context isolation enabled, sandbox on, zero `eval()` |
| **Reproducible Builds** | Deterministic `npm ci + npm run build:win` pipeline (see [REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md)) |

### Formal Specifications

| Document | Contents |
|----------|----------|
| [TEAR_SPEC_v1.md](docs/TEAR_SPEC_v1.md) | Signature scheme, manifest format, verification flow, failure states |
| [THREAT_MODEL.md](docs/THREAT_MODEL.md) | Supply-chain, CI compromise, key compromise, SmartScreen adversarial model |
| [REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md) | Exact steps to reconstruct a bit-identical artifact from source |

---

## Verification (The Point of This Project)

```powershell
# 1. Download the installer from Releases
# 2. Download verify.ps1 from this repo
# 3. Run the verifier (no network calls, no dependencies):
.\verify.ps1 .\HyperSnatch-Setup-1.2.0.exe
```

**SHA-256 Checksums** (full hashes in [SHA256SUMS.txt](SHA256SUMS.txt)):
```
504d4ed8...943f29a5d24bbfd8  HyperSnatch-Setup-1.2.0.exe
fb198e68...3191b05733254c13  HyperSnatch-1.2.0.exe (portable)
```

---

## The Payload: Offline Media URL Extraction

As the functional test vector for the distribution experiment, HyperSnatch statically parses raw HTML, HAR, and JavaScript payloads to extract direct media URLs — entirely offline. No browser automation, no API keys, no telemetry.

**Extraction layers**: Direct regex → Base64 decryption → Iframe recursion → HAR scanning
**Host decoders**: 40+ site-specific decoders (Rapidgator, Mega, Pixeldrain, Doodstream, etc.)

---

## License

MIT — see [LICENSE](LICENSE).