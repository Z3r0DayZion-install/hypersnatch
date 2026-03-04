# Reproducibility

> How to independently rebuild HyperSnatch and compare hashes.

## Prerequisites

| Tool | Version | Why pinned |
|---|---|---|
| Node.js | `20.17.0` | Matches `package.json` engines field and CI runner |
| npm | `10.x` (ships with Node 20) | Required for `npm ci` lockfile resolution |
| Git | Any | To clone the source |
| PowerShell | `5.1+` | For `reproduce.ps1` and `verify.ps1` |

Optional:

| Tool | Version | Purpose |
|---|---|---|
| Rust | `stable` | Only if `hs-core` native module is enabled |
| electron-builder | `24.13.3` | Pinned in devDependencies — installed by `npm ci` |

## Quick Reproduce (One Command)

```powershell
.\scripts\reproduce.ps1
```

This will:
1. Verify Node version matches `20.17.0`
2. Run `npm ci` (deterministic install from lockfile)
3. Run `npm run build:repro` (Electron builder `--dir` mode)
4. Generate `MANIFEST.json` and `SHA256SUMS.txt`
5. Print artifact hashes for manual comparison

## Manual Steps

### 1. Clone and install

```powershell
git clone https://github.com/Z3r0DayZion-install/hypersnatch.git
cd hypersnatch
npm ci
```

`npm ci` installs **exactly** what's in `package-lock.json`. No resolution, no upgrades.

### 2. Build

```powershell
npm run build:repro
```

This runs:
- `scripts/prepare_hs_core.cjs` — prepares native module (if present)
- `electron-builder --dir` — builds unpacked output to `dist/win-unpacked/`
- `scripts/verify_release.js` — runs post-build verification

### 3. Generate manifest

```powershell
npm run postdist
```

Runs `scripts/generate_manifest.cjs`, which:
- Hashes every artifact in `dist/`
- Respects `SOURCE_DATE_EPOCH` for timestamp determinism
- Writes `dist/MANIFEST.json` and `dist/SHA256SUMS.txt`

### 4. Compare hashes

```powershell
# Your local build
Get-Content dist\SHA256SUMS.txt

# Published release hashes
Get-Content hash_manifest.json | ConvertFrom-Json | Select-Object -ExpandProperty hashes
```

If the SHA-256 values match, the build is reproducible.

## What's Deterministic

| Component | Pinned? | How |
|---|---|---|
| Node runtime | ✅ `20.17.0` | `package.json` engines + CI `setup-node` |
| npm dependencies | ✅ Lockfile | `npm ci` from `package-lock.json` |
| Electron | ✅ `28.3.3` | `devDependencies` in `package.json` |
| electron-builder | ✅ `24.13.3` | `devDependencies` in `package.json` |
| Build timestamps | ✅ | `SOURCE_DATE_EPOCH` respected in `generate_manifest.cjs` |

## Known Non-Deterministic Factors

| Factor | Impact | Notes |
|---|---|---|
| Code signing nonce | Changes `.exe` hash on each signing | Only when `CSC_LINK` secret is set |
| Electron builder metadata | May embed build machine hostname | Investigating mitigation |
| OS-level DLL versions | Chromium DLLs may differ across Windows versions | CI uses `windows-latest` |

If you build on a machine with a different Windows version, the unpacked Chromium DLLs may differ. The **application code** (`resources/app.asar`) should always match.

## CI Pipeline Reference

The CI build runs in `.github/workflows/release.yml`:

```
Checkout → Setup Node 20.17.0 → npm ci → test:ci → build:repro → hash → verify → manifest commit → publish
```

See [VERIFICATION.md](VERIFICATION.md) for how the verification chain works end-to-end.
