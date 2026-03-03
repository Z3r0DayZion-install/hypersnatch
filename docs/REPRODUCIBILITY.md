# Reproducibility Guide

A core tenet of the TEAR model is **deterministic reproducibility**: technical users must be able to independently build the artifact from source and arrive at exactly the same SHA-256 hash as the distributed binary.

If you can reproduce it — the binary is what the source says it is.

---

## Environment Requirements

To achieve a bit-identical build, you must use the exact toolchain below:

| Dependency | Version | Notes |
|-----------|---------|-------|
| Node.js | `v20.x` | Do not use v21+ (affects native binding compilation) |
| npm | `v10.x` | Use `npm ci` — not `npm install` |
| Electron Builder | `24.13.3` | Pinned in `package-lock.json` |
| OS | Windows 10/11 x64 | NSIS installer format requires native Windows |
| `NODE_ENV` | `production` | Required — affects asset bundling flags |

---

## Independent Verification Steps

```bash
# 1. Clone the specific release tag
git clone https://github.com/Z3r0DayZion-install/hypersnatch.git
cd hypersnatch
git checkout tags/v1.2.0

# 2. Install exact locked dependencies (not npm install)
npm ci

# 3. Build the Windows release artifact
npm run build:win

# 4. Hash the produced binary
```

```powershell
Get-FileHash -Algorithm SHA256 .\dist\HyperSnatch-Setup-1.2.0.exe | Select-Object Hash
```

**5. Compare against the published hash in** `SHA256SUMS.txt` on the [v1.2.0 release](https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.2.0).

---

## Known Non-Determinism Sources

NSIS (the Windows installer packager) can introduce the following inconsistencies that prevent bit-identical output:

| Source | Cause | Workaround |
|--------|-------|-----------|
| Embedded timestamps | NSIS default behavior | Set `NSIS_DATE` env var to fixed epoch or use `SOURCE_DATE_EPOCH` |
| Compression level variation | Zlib version differences | Pin system zlib version in Docker-based builds |
| Electron binary patching | `electron-builder` resource injection | Use exact `electron-builder` version from `package-lock.json` |

**Current status**: The JS/source layer is fully deterministic. The NSIS installer layer approaches but does not strictly guarantee bit-for-bit output across all build environments. This is a known open issue tracked as a future improvement.

---

## Future: Docker-Based Hermetic Builds

The roadmap includes a reproducible build container:

```dockerfile
FROM electronuserland/builder:wine
ENV SOURCE_DATE_EPOCH=0
ENV NODE_VERSION=20.x
# ... pinned toolchain
```

This will enforce absolute determinism at the packaging step and allow cross-platform reproducibility testing.
