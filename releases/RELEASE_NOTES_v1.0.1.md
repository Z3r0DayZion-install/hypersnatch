# HyperSnatch v1.0.1 — Release Notes

**Release Date:** February 2026  
**Build Commit:** `3aa4cc5d4645ff179654171b165b44386e4eb5aa`  
**Status:** Production Release

---

## What's New in v1.0.1

### Security Hardening
- **AES-256-GCM** authenticated encryption with secure IV handling
- **Electron sandboxing** — context isolation enabled, Node integration disabled
- **XSS prevention** — all unsafe HTML injection paths eliminated
- **Path traversal protection** — comprehensive validation and boundary enforcement
- **IPC allowlisting** — channel-based security for inter-process communication

### Validation Pipeline
- Pluggable validator framework (mock, local server, allowlist)
- Default-deny policy enforcement with configurable modes (strict, audit, lab)
- Structured confidence scoring for all detected candidates

### Evidence System
- Immutable operation logging with timestamps and user attribution
- Court-admissible audit trail with tamper protection
- SHA-256 manifest generation for data provenance

### Exports
- CSV, JSON, and text report generation
- Structured PDF output for professional use
- Manifest files with cryptographic hashes

---

## Download & Verify

### Assets
| File | Description |
|------|-------------|
| `HyperSnatch-Setup-1.0.1.exe` | Windows NSIS installer |
| `HyperSnatch-Portable-1.0.1.exe` | Windows portable (no install) |
| `SHA256SUMS.txt` | Cryptographic checksums |
| `VERIFY_SHA256.ps1` | PowerShell verification script |

### Hash Verification

```powershell
# PowerShell — verify download integrity
.\VERIFY_SHA256.ps1
```

Or manually:
```powershell
Get-FileHash -Algorithm SHA256 .\HyperSnatch-Setup-1.0.1.exe | Select-Object Hash
# Expected: B2A93F88385F300EF971C21C91867C7EA213C13D8C7779AAD8BCB87EAAC69023
```

---

## Quick Start

1. Download the installer or portable EXE
2. Run `HyperSnatch-Setup-1.0.1.exe` (or launch the portable version)
3. Drag-and-drop an HTML file into the interface
4. Review detected resources and confidence scores
5. Export results as CSV, JSON, or PDF

---

## System Requirements

- **OS:** Windows 10 or later (64-bit)
- **RAM:** 4 GB minimum
- **Disk:** 200 MB
- **Network:** Required only for initial license verification

---

## Determinism Guarantee

HyperSnatch produces deterministic results. Run our `sample-payload.html` demo and verify the output SHA-256 hash matches our published proof. See `demo/VERIFY_DEMO.md` for instructions.

---

## Legal

- **License:** Proprietary — Founders License ($39 one-time)
- **Terms:** See [Terms of Use](https://hypersnatch.com/terms)
- **Support:** support@hypersnatch.com (12-hour response)
- **Refund:** 14-day deterministic guarantee
