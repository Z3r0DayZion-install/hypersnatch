# 10-Minute Verification Drill

> Clone the repo. Build it. Verify it. Done in 10 minutes.

## Prerequisites

- Git
- Node.js 20+ (`node -v` → should show `v20.x.x`)
- PowerShell 5.1+ (Windows built-in)

## The Drill

### Step 1: Clone (30 seconds)

```powershell
git clone https://github.com/Z3r0DayZion-install/hypersnatch.git
cd hypersnatch
```

### Step 2: Install dependencies (60 seconds)

```powershell
npm ci
```

Expected: clean install from lockfile. No warnings about resolution.

### Step 3: Run tests (60 seconds)

```powershell
npm test
```

Expected output:
```
SmartDecode:     75/75 passed
DNS Fallback:    16/16 passed
Total:           91/91 — zero network calls
```

### Step 4: Verify the verifier (30 seconds)

```powershell
# PowerShell verifier self-test
.\scripts\verify.ps1 -SelfTest
```

Expected:
```
Test 1: PowerShell Version - ✅ PASS
Test 2: Get-FileHash Cmdlet - ✅ PASS
Test 3: Hash Manifest - ✅ PASS
Test 4: Self Hash Computation - ✅ PASS
Test 5: Offline Operation - ✅ PASS
```

```powershell
# Node.js verifier self-test
node scripts/verify_node.js --self-test
```

Expected:
```
✅ Node v20.x.x (Ed25519 supported)
✅ SHA-256 computation
✅ Ed25519 sign/verify
✅ Verify kit found
```

### Step 5: Verify a binary (60 seconds)

Download `HyperSnatch-Setup-1.2.1.exe` from the latest GitHub Release, then:

```powershell
# PowerShell
.\scripts\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.1.exe
```

Expected:
```
✅ VERIFICATION SUCCESSFUL
   Artifact: HyperSnatch-Setup-1.2.1.exe
   Version: 1.2.1
   Status: AUTHENTIC
```

```powershell
# Node.js (includes signature check)
node scripts/verify_node.js HyperSnatch-Setup-1.2.1.exe
```

Expected:
```
✅ Manifest signature VALID
✅ Hash matches manifest entry
✅ VERIFIED (signature + hash)
```

### Step 6: Verify manifest signature (30 seconds)

```powershell
node scripts/sign_manifest.cjs --verify dist/MANIFEST.json --sig release/verify/manifest.sig --pubkey release/verify/root_public_key.pem
```

Expected:
```
✅ SIGNATURE VALID
```

### Step 7: Check provenance (30 seconds)

```powershell
Get-Content release/provenance.json | ConvertFrom-Json | Select-Object -ExpandProperty invocation | ConvertTo-Json
```

Verify the `configSource.digest.sha1` matches the tagged commit.

### Step 8: Check transparency log (10 seconds)

```powershell
Get-Content release/transparency.log
```

Each release should have an entry with version, commit, hash, signature, and timestamp.

## Trust Anchor

Before running Step 5, confirm the public key fingerprint matches:

```
B90B E0DB 35A2 8123 318E 9BCB FF0D ECB3 10B7 906B D538 C8F5 0541 3C8D 67E3 6CDC
```

This fingerprint is published in:
- `release/verify/ROOT_FINGERPRINT.txt`
- `README.md` → Trust Anchor section
- `docs/PROOF.md`

## Pass / Fail

| Step | Expected | If it fails |
|---|---|---|
| `npm ci` | Clean install | Check Node version (`v20.x`) |
| `npm test` | 91+ tests pass | Report via GitHub Issues |
| `verify.ps1 -SelfTest` | 5/5 pass | Check PowerShell version |
| `verify_node.js --self-test` | 4/4 pass | Check Node version |
| Binary verification | `✅ VERIFIED` | Binary may be tampered — **DO NOT RUN** |
| Signature check | `✅ SIGNATURE VALID` | Manifest may be forged |
