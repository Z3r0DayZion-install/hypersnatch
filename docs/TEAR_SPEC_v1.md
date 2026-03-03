# TEAR Protocol Specification v1.0

**Transparent Enforcement & Artifact Reproducibility**

TEAR is the detached verification protocol used by HyperSnatch to distribute Windows binaries without an EV code-signing certificate. This document is the formal specification.

---

## 1. Goals

- Establish an offline, mathematically provable chain of trust between source author and end user.
- Remove dependence on third-party Certificate Authorities.
- Provide an auditable, minimal-footprint structure for checking artifact integrity.

## 2. Cryptographic Primitives

| Primitive | Algorithm | Rationale |
|-----------|-----------|-----------|
| Hashing | SHA-256 | Widely available via PowerShell `Get-FileHash`, no external tooling required on Windows |
| Signatures | Ed25519 | Short keys, fast verification, no parameter confusion attacks |

## 3. Manifest Format

The canonical state of truth is `SHA256SUMS.txt`, a newline-delimited list of `<hash>  <filename>` pairs.

```
504d4ed8[...]943f29a5d24bbfd8  HyperSnatch-Setup-1.2.0.exe
fb198e68[...]3191b05733254c13  HyperSnatch-1.2.0.exe
```

*Future v2*: A signed JSON envelope (`manifest.json`) will include an Ed25519 signature over the hash list and the release version string.

```json
{
  "version": "1.2.0",
  "artifacts": {
    "HyperSnatch-Setup-1.2.0.exe": "SHA256-HEX",
    "HyperSnatch-1.2.0.exe": "SHA256-HEX"
  },
  "ed25519_sig": "SIG-HEX",
  "root_pubkey": "PUBKEY-HEX"
}
```

## 4. Verification Flow

The canonical implementation is `verify.ps1` (~60 lines, zero external dependencies).

**Step-by-step:**

1. User downloads `HyperSnatch-Setup-<version>.exe` and `verify.ps1` to the same directory.
2. User reads `verify.ps1` source (it is intentionally concise and auditable).
3. User executes: `.\verify.ps1 .\HyperSnatch-Setup-1.2.0.exe`
4. `verify.ps1` calls `Get-FileHash -Algorithm SHA256` on the binary — **no network calls**.
5. Script compares computed hash against hardcoded expected hash.
6. Script outputs `[+] SUCCESS: Hash matches` or `[-] FAIL: Hash mismatch. Do not run this binary.`

## 5. Failure States

| State | Cause | Required Action |
|-------|-------|----------------|
| Hash Mismatch | Binary was tampered with in transit or at rest | **Discard binary immediately.** Report via GitHub Issues. |
| Hash List Not Found | `SHA256SUMS.txt` missing from repo | Treat as unverifiable. Do not run. |
| Signature Invalid (v2) | Manifest signature does not match root public key | Halt. Potential key compromise. Check revocation channel. |

## 6. UX Flow

```
Download .exe + verify.ps1
        ↓
  Read verify.ps1  ← intentionally kept auditable (~60 lines)
        ↓
  Run .\verify.ps1 .\HyperSnatch-Setup-1.2.0.exe
        ↓
  [+] SUCCESS: Hash matches (SHA-256: 504d4ed8...)
        ↓
  Accept SmartScreen → Run   ← trust established before OS prompt
```

The SmartScreen "Run Anyway" dialog occurs *after* the user has independently verified integrity — intentionally inverting the typical "trust the certificate" flow.

## 7. Root Key Model

- One offline Ed25519 root key per maintainer identity.
- Public key fingerprint published in the README, on a personal site, and in the HN profile for out-of-band verification.
- Sub-keys issued per release cycle. Root key never touches the CI pipeline.
