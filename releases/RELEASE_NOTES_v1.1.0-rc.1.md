# HyperSnatch v1.1.0-rc.1 — Release Notes

**Release Date:** February 28, 2026  
**SmartDecode Engine:** v2.4.0  
**Status:** Release Candidate

---

## What's New in v1.1.0-rc.1

### SmartDecode 2.4.0
- **Multi-source tag multiplicity scoring** — pages with multiple `<source>` tags get a confidence boost
- **Host-specific URL pattern boosts** — Emload, Kshared, and Rapidgator CDN patterns score higher
- **URL deduplication** — identical candidates are merged before ranking
- **Source-count confidence scaling** — richer extraction pages scored proportionally (capped at +0.1)

### 40 Host Decoders — Full Coverage
Every decoder implements both `extract()` and `resurrect()`:

| | | | | |
|---|---|---|---|---|
| 1fichier | daofile | ddownload | doodstream | emload |
| faststream | filefactory | filelion | filespace | gofile |
| hexupload | hotlink | katfile | krakenfiles | kshared |
| lulustream | mediafire | mega | mixdrop | nitroflare |
| pixeldrain | rapidgator | rosefile | streamtape | streamwish |
| turbobit | upfiles | uploadgig | upstream | uptobox |
| userload | userscloud | veestream | vidguard | vidlox |
| vidmoly | vidoza | voe | vtube | vudeo |

### DNS Fallback (DoH)
- **Cloudflare DNS-over-HTTPS** resolution when CDN hostnames are blocked
- Offline JSON cache with configurable TTL
- Exponential backoff retry (max 3 attempts)
- Stale cache fallback when DoH is unreachable
- Toggle-able in Settings (off by default)

### Stream Preview Player
- In-app `<video>` player embedded in the right panel
- Click any resurrected candidate to preview playback
- Play / pause / seek controls
- Zero external dependencies

### UX Enhancements
- **Decode glow animation** — neon cyan pulse on the candidate panel after successful decode
- **Clipboard auto-copy** — copies the best candidate URL to clipboard on decode (toggle-able)
- **Settings drawer** — slide-out panel with 3 toggle switches, persisted to localStorage
- **Quantum Vault** — hidden forensic dashboard via `Ctrl+Shift+V` + unlock code

### Electron Build Script
- `scripts/build_wrapper.js` — preflight checks, `electron-builder` orchestration
- SHA-256 artifact hashing for every output file
- Build manifest generation with integrity verification
- Exit code 42 on integrity failure

### 25 Emload Test Fixtures
- Synthetic HTML fixtures covering single-source, multi-source, base64, iframe, premium-gate, CDN variations, and edge cases
- Used for deterministic offline testing

---

## Test Results

| Suite | Count | Status |
|-------|-------|--------|
| SmartDecode (sections 1-11) | 71 | ✅ Pass |
| DNS Fallback (sections 1-5) | 16 | ✅ Pass |
| Host Decoder Proof (40 hosts) | 40 | ✅ Pass |
| **Total** | **127** | **✅ All pass** |

Zero network calls. Fully deterministic. Offline verified.

---

## Download & Verify

### Assets
| File | Description |
|------|-------------|
| `HyperSnatch-Setup-1.1.0-rc.1.exe` | Windows NSIS installer |
| `HyperSnatch-Portable-1.1.0-rc.1.exe` | Windows portable (no install) |
| `SHA256SUMS.txt` | Cryptographic checksums |

### Hash Verification
```powershell
Get-FileHash -Algorithm SHA256 .\HyperSnatch-Setup-1.1.0-rc.1.exe | Select-Object Hash
```

---

## Upgrade from v1.0.1

All v1.0.1 features are preserved. New capabilities are additive:
- Settings drawer is new — defaults: auto-copy ON, glow ON, DNS fallback OFF
- Quantum Vault is hidden by default — `Ctrl+Shift+V` to access
- All 40 host decoders are backward-compatible

---

## System Requirements

- **OS:** Windows 10 or later (64-bit)
- **RAM:** 4 GB minimum
- **Disk:** 200 MB
- **Network:** Required only for initial license verification + optional DNS fallback

---

## Legal

- **License:** Proprietary — Founders License ($149 one-time)
- **Terms:** See [Terms of Use](https://hypersnatch.com/terms)
- **Support:** support@hypersnatch.com (12-hour response)
- **Refund:** 14-day deterministic guarantee
