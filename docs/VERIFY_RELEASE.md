# Verify a Release

> Step-by-step instructions for verifying a HyperSnatch release artifact.

## Prerequisites

- Windows: PowerShell 5.1+ (built-in)
- Cross-platform: Node.js 15+ (for Ed25519 support)

## Step 1: Download

From the [latest GitHub Release](https://github.com/Z3r0DayZion-install/hypersnatch/releases):

Download **all** of these:
- `HyperSnatch-Setup-X.Y.Z.exe` — the installer
- `verify.ps1` — the PowerShell verifier
- `verify_node.js` — the Node.js verifier (optional)
- `SHA256SUMS.txt` — plain-text checksums
- `MANIFEST.json` — build manifest
- `manifest.sig` — Ed25519 signature (if available)
- `root_public_key.pem` — signing public key (if available)
- `provenance.json` — SLSA provenance attestation

## Step 2: Verify (PowerShell)

```powershell
.\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.1.exe
```

### Expected output (PASS):

```
✅ VERIFICATION SUCCESSFUL
   Artifact: HyperSnatch-Setup-1.2.1.exe
   Version: 1.2.1
   Status: AUTHENTIC

✓ This binary is safe to run
```

### Expected output (FAIL):

```
❌ VERIFICATION FAILED
   This hash does NOT match any known build
   DO NOT RUN THIS FILE
```

## Step 3: Verify (Node.js — Cross-Platform)

```bash
node verify_node.js HyperSnatch-Setup-1.2.1.exe
```

This additionally checks:
1. Ed25519 manifest signature (if `manifest.sig` and `root_public_key.pem` are present)
2. SHA-256 hash against manifest
3. Manifest schema validity

### Expected output (PASS):

```
  ✅ Manifest signature VALID
  ✅ Hash matches manifest entry: dist/HyperSnatch-Setup-1.2.1.exe
  ✅ Manifest schema valid (v1.2.1)

  ✅ VERIFIED (signature + hash)
```

## Step 4: Verify Sigstore Signature (Optional)

If the release includes `.sig` and `.pem` files:

```bash
cosign verify-blob \
  --certificate HyperSnatch-Setup-1.2.1.exe.pem \
  --signature HyperSnatch-Setup-1.2.1.exe.sig \
  HyperSnatch-Setup-1.2.1.exe
```

## Step 5: Check Provenance (Optional)

Open `provenance.json` and verify:
- `invocation.configSource.digest.sha1` matches the tagged commit
- `metadata.buildInvocationId` matches the GitHub Actions run ID
- `subject[].digest.sha256` matches the artifact hash

## Self-Test

Both verifiers support self-testing:

```powershell
.\verify.ps1 -SelfTest
node verify_node.js --self-test
```

## Verification Decision Tree

```
Download artifact
    │
    ├── Run verify.ps1 or verify_node.js
    │     │
    │     ├── ✅ Hash matches  →  Check signature
    │     │     │
    │     │     ├── ✅ Signature valid  →  SAFE TO RUN
    │     │     └── ⚠️  No signature    →  Hash-only trust (acceptable)
    │     │
    │     └── ❌ Hash mismatch  →  DO NOT RUN
    │
    └── No verifier available
          │
          └── Manually compute SHA-256 and compare against SHA256SUMS.txt
```
