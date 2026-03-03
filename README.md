# HyperSnatch

**Offline media URL extraction from raw HTML — with detached binary verification.**

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.2.0)
[![Tests](https://img.shields.io/badge/tests-158_passing-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/platform-Windows_10%2F11_x64-lightgrey)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

HyperSnatch extracts direct download URLs from raw HTML, HAR, and JavaScript payloads. It runs completely offline — no browser automation, no API keys, no network calls, no telemetry.

## Download & Verify

```powershell
# 1. Download the installer from Releases
# 2. Download verify.ps1 from this repo
# 3. Verify before running:
.\verify.ps1 .\HyperSnatch-Setup-1.2.0.exe
```

The verifier is a ~60-line PowerShell script with zero dependencies. It computes the SHA-256 hash and checks it against a hardcoded manifest. No network calls. [Read more about the verification model →](docs/DETACHED_VERIFICATION_BLOG.md)

### SHA-256 Checksums

```
504d4ed8...943f29a5d24bbfd8  HyperSnatch-Setup-1.2.0.exe (Installer)
fb198e68...3191b05733254c13  HyperSnatch 1.2.0.exe (Portable)
```

Full hashes in [SHA256SUMS.txt](SHA256SUMS.txt).

---

## What It Does

Paste raw HTML source into HyperSnatch. It statically parses the markup and extracts every media URL it can find — MP4, M3U8, PDF streams, encoded payloads — without executing any JavaScript or making any requests.

### Extraction Layers
1. **Direct regex** — MP4, M3U8, PDF stream patterns
2. **Base64 decryption** — Encoded `<script>` payloads up to 8MB
3. **Iframe recursion** — `srcdoc` boundaries up to 3 levels deep
4. **HAR response scanning** — Network archive body inspection

### Host Decoders
40+ site-specific decoders with `extract()` and `resurrect()` methods for Rapidgator, Mega, Emload, Pixeldrain, Doodstream, and more.

## Architecture

Dual-engine design:
- **JavaScript engine** — Cross-platform, regex-based extraction
- **Rust engine (`hs-core`)** — High-speed parsing for large payloads

Built with Electron. Context isolation enabled, sandbox on, zero `eval()` in the entire codebase.

## Why Unsigned?

This project ships **unsigned** Windows binaries as an experiment in [detached verification](docs/DETACHED_VERIFICATION_BLOG.md). Instead of paying for an EV code-signing certificate and relying on Microsoft's opaque SmartScreen telemetry, we provide:

- A deterministic hash verifier (`verify.ps1`)
- Public SHA-256 checksums
- Full source code

The thesis: for a technical user base, transparent offline verification is higher trust than opaque certificate-based signing.

## Test Suite

| Suite | Tests | Status |
|-------|-------|--------|
| SmartDecode Core | 75 | ✅ |
| License System | 43 | ✅ |
| Host Decoders | 40 | ✅ |
| **Total** | **158** | **All passing** |

## License

MIT — see [LICENSE](LICENSE).