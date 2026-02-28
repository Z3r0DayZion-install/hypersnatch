# HyperSnatch

**Deterministic Static Analysis for HTML Media Resources**

[![License](https://img.shields.io/badge/license-Founders-00d084)](https://cashdominion.gumroad.com/l/itpxg)
[![Version](https://img.shields.io/badge/version-1.0.1-38bdf8)](releases/RELEASE_NOTES_v1.0.1.md)
[![Tests](https://img.shields.io/badge/tests-58%2F58-00d084)]()
[![Hosts](https://img.shields.io/badge/host%20decoders-40-a855f7)]()

HyperSnatch is an offline-first, privacy-by-design desktop utility that parses complex webpage source code to surface direct media resource URLs — without cloud APIs, external telemetry, or headless automation.

---

## What It Does

You paste HTML source code → HyperSnatch finds the direct download/stream URLs hidden inside.

```
HTML page source → AST parsing → URL extraction → Host-specific decoding → Confidence scoring → Export
```

**40 host-specific decoders** recognize patterns from services like emload, kshared, mediafire, pixeldrain, mega, doodstream, streamtape, and 33 more. Each decoder scans for download buttons, CDN links, jwplayer configs, base64-encoded URLs, and obfuscated JS variables.

## Key Features

| Feature | Description |
|---------|-------------|
| **Offline Analysis** | Zero network requests during analysis. Runs entirely on local hardware. |
| **40 Host Decoders** | Specialized pattern extraction for 40 file hosting and streaming services |
| **Deterministic Output** | Same input always produces the same output, verifiable via SHA-256 |
| **Evidence Logging** | Immutable audit trail with timestamps and session management |
| **Auth Boundary Detection** | Detects login gates, premium paywalls, signed URLs — refuses to proceed past auth walls |
| **Multiple Input Types** | HTML source, HAR files, direct URLs |
| **Professional Export** | CSV, JSON, PDF with SHA-256 data provenance |
| **Security Hardened** | AES-256-GCM encryption, Electron sandboxing, context isolation |

## Quick Start

### Option 1: Desktop App (Recommended)
1. [Purchase the Founders License](https://cashdominion.gumroad.com/l/itpxg) ($39 one-time)
2. Download the Windows installer or portable EXE
3. Open the app → paste HTML source → click **Resurrect Links**

### Option 2: Source Capture Bookmarklet
1. Visit the [bookmarklet page](landing/bookmarklet.html)
2. Drag the button to your bookmarks bar
3. Click it on any page to capture the live DOM
4. Paste the captured source into HyperSnatch

## Supported Hosts

<details>
<summary>40 file hosting and streaming services</summary>

**File Hosts:** 1fichier, daofile, ddownload, filefactory, filespace, hexupload, katfile, krakenfiles, mediafire, mega, nitroflare, pixeldrain, rapidgator, rosefile, turbobit, upfiles, uploadgig, uptobox, userload, userscloud

**Video/Streaming:** doodstream, emload, faststream, filelion, gofile, hotlink, kshared, lulustream, mixdrop, streamtape, streamwish, upstream, veestream, vidguard, vidlox, vidmoly, vidoza, voe, vtube, vudeo
</details>

## Determinism Verification

HyperSnatch guarantees deterministic output. Verify it yourself:

```powershell
# 1. Analyze the sample payload
#    (drag demo/sample-payload.html into HyperSnatch)

# 2. Export the manifest as JSON

# 3. Compute SHA-256
Get-FileHash -Algorithm SHA256 .\manifest_output.json | Select-Object Hash

# 4. Compare against published hash in demo/EXPECTED_OUTPUT.json
```

See [demo/VERIFY_DEMO.md](demo/VERIFY_DEMO.md) for full instructions.

## Test Suite

```
node tests/smartdecode.test.js
# 🔈 Test Results: 58 passed, 0 failed out of 58 tests
```

## Architecture

```
hypersnatch.html          ← Main application UI
src/core/smartdecode/     ← SmartDecode engine
  ├── index.js            ← Entry point & orchestrator
  ├── direct.js           ← Direct URL extraction
  ├── base64.js           ← Base64 blob decoder
  ├── iframe.js           ← Iframe recursion (depth-limited)
  ├── script-trace.js     ← JS variable/config scanning
  ├── m3u8.js             ← HLS playlist parser
  ├── ranker.js           ← Confidence scoring & ranking
  ├── auth-boundary.js    ← Auth gate detection
  └── hosts/              ← 40 host-specific decoders
core/                     ← Application core
  ├── engine_core.js      ← Central orchestration
  ├── evidence_logger.js  ← Immutable audit trail
  ├── license_system.js   ← ECDSA license verification
  └── security_hardening.js ← Runtime security
```

## Security

- **Zero eval()** — No `eval()` or `Function()` calls in the entire SmartDecode engine
- **Zero network I/O** — Analysis never touches the network
- **Context isolation** — Electron sandboxing with disabled Node integration
- **IPC allowlisting** — Only whitelisted IPC channels
- **AES-256-GCM** — Authenticated encryption for sensitive data

## License

[Founders License](https://cashdominion.gumroad.com/l/itpxg) — $39 one-time payment. See [Terms of Use](landing/terms.html).

## Support

Email: support@hypersnatch.com (12-hour response time)
