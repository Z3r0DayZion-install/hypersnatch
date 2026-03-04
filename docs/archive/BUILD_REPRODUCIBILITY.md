# HyperSnatch Build Reproducibility (v1.2)

To ensure institutional trust, HyperSnatch Vanguard supports a deterministic build pipeline. Any security auditor can reproduce the release artifact hash using the following process.

## 🛠️ Requirements
*   **Node.js:** v20.17.0 (Locked)
*   **OS:** Windows 10/11 (x64)
*   **Environment:** Fresh clone, no uncommitted changes.

## 🚀 One-Command Build
The following command executes the preparation, native core compilation, Electron packaging, and final verification in a clean sequence:

```powershell
npm run build:repro
```

### What this script does:
1.  **Prepare:** Cleans `dist/` and `build/`.
2.  **Core Sync:** Re-bundles the `hs-core.exe` Rust binary.
3.  **Package:** Runs `electron-builder` with pinned dependency versions.
4.  **Verify:** Executes the `verify_release.js` logic to ensure all security hardened settings and required files are present.

## 🔎 Verification
Once complete, the installer SHA-256 hash should be compared against the officially published `VANGUARD_RELEASE_HASHES.txt`.

### Manual Hash Calculation:
```powershell
# PowerShell
Get-FileHash -Algorithm SHA256 dist\HyperSnatch-Setup-1.2.0-dev.exe

# Node.js
node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync('dist/HyperSnatch-Setup-1.2.0-dev.exe')).digest('hex'))"
```

## 📦 Version Pinning
All production dependencies are locked to exact versions in `package.json` to prevent supply-chain variability:
*   `electron`: 28.3.3
*   `electron-builder`: 24.13.3
*   `ajv`: 6.12.6

---
*HyperSnatch Security Team - March 2026*
