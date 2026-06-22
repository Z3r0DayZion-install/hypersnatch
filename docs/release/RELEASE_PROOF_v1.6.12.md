# HyperSnatch Release Proof v1.6.12

Date: 2026-06-22
Release line: stable — critical packaged UI interaction hotfix

## Locked Release Record

- Stable release: `v1.6.12`
- Tag: `v1.6.12` (annotated)
- Installer: `HyperSnatch-Setup-1.6.12.exe`
- Installer SHA256: `9ef2035a305e2fe95fed43351bca15d4c28a4c607e97cb373b89ece60e92feb4`
- Zip: `HyperSnatch_Vanguard_v1.6.12.zip`
- Zip SHA256: `b748daecf5d7bf4b3a07116ae90e5cbefd2c6211d5cecb602a1c841dbc536692`
- win-unpacked app SHA256: `aee3a73d1ab56b00a5dd5096d15a06d7c932a69b97fbe882ca889ad37d5e2a3d`
- app.asar SHA256: `0675e529a4f17427931958e2bd8fa4453edff84333d4dc56401da288a4c03f73`
- app.asar size: 4,657,526 bytes
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.12`

## Gate Sequence and Result

1. `npm run verify:ui` — PASS
2. `npm test` — PASS
3. `npm run clean:dist:stale` — cleaned v1.6.11 artifacts
4. `npm run dist` — PASS (Setup-1.6.12.exe + win-unpacked + manifest)
5. `npm run verify:asar` — PASS (69/69 local require() modules present in app.asar, visible window)
6. `npm run release:gate` — PASS (preflight, test, verify:ui, build:wrapper, verify, verify:asar, audit:stable)

## Identity Truth

- `package.json` version = `1.6.12`
- `VERSION.json` version = `1.6.12`, codename = `Insane Mode`
- `APP_VERSION_FALLBACK` = `1.6.12`
- UI badge `#uiVer` = `v1.6.12`
- `<title>` = `HyperSnatch — The Proof Foundry™`
- `.brand-kicker` = `The Proof Foundry™`

## Root Cause — Why the v1.6.11 Packaged UI Was Inert

The Content-Security-Policy set in `src/main.js` used `script-src 'self'`, with no
`'unsafe-inline'`. The entire renderer script in `ui/hypersnatch-ui.html` is an inline
`<script>` block, so the CSP blocked it from executing in the packaged build. The
renderer `state` object was never defined, no event listeners attached, and every
control in the UI was inert. The window opened but nothing responded.

Two secondary defects were fixed in the same hotfix:

1. **Null-deref regression from frameless window controls.** Top-level
   `el("btnWinMinimize"/"btnWinMaximize"/"btnWinClose")` and `el('btnImportLicense')`
   `.addEventListener(...)` calls threw `TypeError: Cannot read properties of null`
   before `state` was defined when those elements were absent, halting renderer init.
   All are now null-guarded.

2. **`SovereignAuth is not defined`.** `src/main.js` referenced `SovereignAuth`
   (in `checkLicenseLocally` / `requireTier`) but never required the module, throwing
   a `ReferenceError` from the `get-app-info` IPC handler. Added
   `require('./core/security/sovereign_auth')`.

### Fixes

```diff
- "script-src 'self'; " +
+ "script-src 'self' 'unsafe-inline'; " +
```

```diff
+ const SovereignAuth = require('./core/security/sovereign_auth');
```

```diff
- el("btnWinMinimize").addEventListener("click", ...)
+ if (el("btnWinMinimize")) el("btnWinMinimize").addEventListener("click", ...)
```

## Packed Build Launch Verification (win-unpacked)

```
dist\win-unpacked\HyperSnatch.exe
→ MainWindowTitle:  HyperSnatch — The Proof Foundry™
→ Window visible:   CONFIRMED (verify:asar)
→ Local requires:   69/69 present in app.asar
```

## Installed-Copy Interaction Proof

Installed via `HyperSnatch-Setup-1.6.12.exe` (silent `/S`) to
`%LOCALAPPDATA%\Programs\HyperSnatch\HyperSnatch.exe`, launched with
`--remote-debugging-port=9222`, verified over CDP:

```
MainWindowHandle:        3212644 (!= 0)
document.title:          HyperSnatch — The Proof Foundry™
.brand-kicker:           The Proof Foundry™
#uiVer:                  v1.6.12
APP_VERSION_FALLBACK:    1.6.12
renderer state:          DEFINED            (CSP fix confirmed in packaged build)
getAppInfo():            OK version=1.6.12  (SovereignAuth require fix confirmed)
getForensicSnapshot():   success=true
real click btnLoadEvidence → status text changed:
  "Awaiting payload. Ready for bridge decode."
  → "Loading Forensic Artifact bundle..."   (visible state change CONFIRMED)
```

## Security Follow-up (post-v1.6.12, separate lane)

`'unsafe-inline'` is an emergency compatibility patch. Immediately after v1.6.12,
open a hardening lane to:

- Move inline renderer JavaScript out of `hypersnatch-ui.html` into a local packaged
  `.js` file.
- Restore CSP to `script-src 'self'` without `'unsafe-inline'`.

Do not block the hotfix on that refactor.

## Publish Checklist

- [x] `npm run verify:ui` PASS
- [x] `npm test` PASS
- [x] `npm run dist` PASS
- [x] `npm run verify:asar` PASS (window visible, 69/69 modules packed)
- [x] `npm run release:gate` PASS (all 7 steps)
- [x] `win-unpacked` launch: window visible, title = `HyperSnatch — The Proof Foundry™`
- [x] Installed-copy interaction proof: window handle != 0, v1.6.12 everywhere, getAppInfo OK, getForensicSnapshot success=true, real click → visible state change
- [x] MANIFEST.json + SHA256SUMS.txt generated and consistent with computed hashes
- [x] Annotated tag `v1.6.12` (commit `5a3f574a`)
- [x] `git push origin postlaunch/release-gate-packaged-asar-proof` + `git push origin v1.6.12`
- [x] GitHub Release: title `HyperSnatch v1.6.12 — Critical Packaged UI Interaction Hotfix` — PUBLISHED (marked latest)
      https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.12
- [x] Upload `HyperSnatch-Setup-1.6.12.exe` + `HyperSnatch_Vanguard_v1.6.12.zip` (via `gh release create`)
- [x] v1.6.11 marked superseded on GitHub (banner prepended, original body preserved)
- [ ] HN update posted (draft prepared; post manually)
