# Verification

> How to verify a HyperSnatch binary is authentic.

## Quick Verify (30 seconds)

```powershell
# Download the binary + verify kit from a GitHub Release, then:
.\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.1.exe
```

Output:

```
✅ VERIFICATION SUCCESSFUL
   Artifact: HyperSnatch-Setup-1.2.1.exe
   Version: 1.2.1
   Status: AUTHENTIC
```

or:

```
❌ VERIFICATION FAILED
   This hash does NOT match any known build
   DO NOT RUN THIS FILE
```

## Verification Chain

```
┌──────────┐    ┌──────────────┐    ┌────────────────┐    ┌──────────────┐    ┌──────────────┐
│  Source   │───>│   CI Build   │───>│ Hash Generation│───>│   Manifest   │───>│   User       │
│  Code    │    │  (GitHub     │    │ (SHA-256 per   │    │   Commit     │    │   Verifies   │
│  (git)   │    │   Actions)   │    │  artifact)     │    │  (to main)   │    │  (verify.ps1)│
└──────────┘    └──────────────┘    └────────────────┘    └──────────────┘    └──────────────┘
```

### Link 1: Source → CI Build

- Triggered by `git tag v*` push or manual `workflow_dispatch`
- Runner: `windows-latest` in GitHub Actions
- Toolchain: Node 20.17.0, Electron 28.3.3, electron-builder 24.13.3
- Dependencies installed via `npm ci` (lockfile-deterministic)
- Build command: `npm run build:repro`
- File: `.github/workflows/release.yml`

### Link 2: CI Build → Hash Generation

- After build, CI computes SHA-256 of every `.exe` in `dist/`
- Hashes stored as GitHub Actions output variables
- File: `.github/workflows/release.yml` steps `hash` and `verify`

### Link 3: Hash Generation → Manifest Commit

- CI runs `scripts/generate_manifest.cjs`
- Outputs: `dist/MANIFEST.json`, `dist/SHA256SUMS.txt`
- CI also runs `verify.ps1 -UpdateHashes` to update `hash_manifest.json`
- On `main` branch: CI auto-commits updated `hash_manifest.json`
- File: `scripts/generate_manifest.cjs`

### Link 4: Manifest → Release Publication

- CI publishes to GitHub Releases via `softprops/action-gh-release`
- Release assets include: `.exe` files, `hash_manifest.json`, `verify.ps1`, `verify.bat`
- User downloads both the binary and the verifier together

### Link 5: User Verification

- User runs `verify.ps1 -FilePath <binary>`
- Script computes SHA-256 of the local file
- Compares against `hash_manifest.json` (shipped with release) and hardcoded fallback hashes
- Reports PASS or FAIL with artifact metadata
- Entirely offline — no network calls
- File: `scripts/verify.ps1`

## Verify Kit Structure

Every release ships these verification assets:

```
release/verify/
├── manifest.json        # Build manifest with file hashes and versions
├── SHA256SUMS.txt       # Plain-text checksums (standard format)
├── verify.ps1           # PowerShell verifier (self-testable)
├── verify.bat           # Wrapper for double-click execution
└── ROOT_FINGERPRINT.txt # Release signing key fingerprint
```

## Verifier Self-Test

The verifier can verify itself:

```powershell
.\verify.ps1 -SelfTest
```

This checks:
1. PowerShell version ≥ 5
2. `Get-FileHash` cmdlet available
3. Hash manifest loads correctly
4. Self hash computation works
5. Offline mode capability

## Runtime Integrity (Post-Install)

After installation, `security_hardening.js` provides:
- Module integrity checks against known hashes
- Manifest verification via `window.hyper.verifyManifest()`
- Runtime tamper detection (prototype checks, external script detection)
- Lockdown mode on any integrity violation

See [THREAT_MODEL.md](THREAT_MODEL.md) for what this does and doesn't protect against.
