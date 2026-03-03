# HyperSnatch

**Deterministic Static Analysis for Forensics (Vanguard v1.2.0)**

[![License](https://img.shields.io/badge/license-Founders-00d084)](https://cashdominion.gumroad.com/l/itpxg)
[![Version](https://img.shields.io/badge/version-1.2.0_Vanguard-blue.svg)]()
[![Tests](https://img.shields.io/badge/tests-158%2F158_passing-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/platform-Windows_10%2F11_x64-lightgrey)]()

HyperSnatch is an offline-first forensic engine for the independent security consultant. It deterministically extracts embedded media endpoints from HTML, HAR, and JS artifacts — without executing hostile code, making network requests, or sending telemetry.

---

## 🛡️ Core Capabilities

- **100% Offline & Deterministic:** No cloud APIs. No telemetry. Same input = same output, SHA-256 verifiable.
- **40+ Host Decoders:** Rapidgator, Mega, Emload, Pixeldrain, Doodstream, and 35+ more — each with `extract()` and `resurrect()` methods.
- **ECDSA-Signed Licensing:** Hardware-bound license keys using secp256k1 signatures. Fully offline verification — no phone-home, no accounts.
- **Auth Boundary Detection:** Automatically detects login gates, premium paywalls, and signed URLs. Logs as refusals to preserve legal standing.
- **Sovereign Audit Chain:** Forensic exports stamped with deterministic Merkle Root and HMAC-SHA256 session keys with Perfect Forward Secrecy.
- **Court-Ready Exports:** PDF, JSON, CSV reports with certainty tiers, extracted URLs, and legal exclusions.

## 💰 Licensing

| Tier | Price | Features |
|------|-------|----------|
| **Community** | Free | Core analysis, 40+ decoders, JSON export |
| **Sovereign** | $149 one-time | + PDF export, Final Freeze, Audit Chain, Quantum Vault |
| **Institutional** | $499 one-time | + Headless CLI, Site License (5 seats), Priority Support |

[Get the Founders License →](https://cashdominion.gumroad.com/l/itpxg)

## 🚀 Usage

### Desktop UI (Standard Workflow)
Launch HyperSnatch, paste HTML/HAR/JS source, click **Decode**, review ranked candidates, export reports.

### Headless CLI (Institutional)
```bash
# Requires Institutional license
hypersnatch-cli artifact.html --format table
hypersnatch-cli evidence.har --out results.json
```

### Bookmarklet (Source Capture)
Drag-to-install bookmarklet captures the live DOM (including JS-rendered content) for analysis. See [Bookmarklet Page](https://z3r0dayzion-install.github.io/hypersnatch-site/bookmarklet.html).

## 🏗️ Architecture

SmartDecode v3.1 dual-engine:
1. **JavaScript Engine:** Cross-platform fallback for forensic regex extraction.
2. **Rust Engine (hs-core):** Memory-safe, high-speed parsing for extreme payloads.

### Extraction Layers
1. **Direct Regex** — MP4, M3U8, PDF stream patterns
2. **Base64 Decryption** — Encoded `<script>` payloads up to 8MB
3. **Iframe Recursion** — `srcdoc` boundaries up to 3 levels deep
4. **HAR Response Scanning** — Network archive body inspection

### Security
- Electron with context isolation, sandbox, disabled Node integration
- IPC allowlisting — only explicit channels exposed
- Zero `eval()` in entire codebase
- ECDSA secp256k1 for license verification

## ✅ Test Suite

| Suite | Count | Status |
|-------|-------|--------|
| SmartDecode Core | 75 | ✅ |
| License System | 43 | ✅ |
| Host Decoders | 40 | ✅ |
| **Total** | **158** | **All Passing** |

## 📜 License

[Founders License](https://cashdominion.gumroad.com/l/itpxg) — Hardware-bound, offline-verified, ECDSA-signed.

---
*© 2026 HyperSnatch. Built for forensic analysts who bill $150/hr.*