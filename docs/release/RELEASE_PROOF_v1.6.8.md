# HyperSnatch Release Proof v1.6.8

Date: 2026-06-21
Release line: stable (window-show hotfix)

## Locked Release Record

- Stable release: `v1.6.8`
- Tag: `v1.6.8` (annotated)
- Installer: `HyperSnatch-Setup-1.6.8.exe`
- Installer SHA256: `26e6bdd798d73b6ea6738994d4908dbc2e96d19d8819eae29ef6934801d6f7f3`
- app.asar SHA256: `ef76da28209c94487e1ff2a845ffa5ecdd24b6fc2adc5be82fb4111084e5c1e4`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.8`

## Gate Sequence and Result

1. `npx playwright test` — PASS (93/93 E2E tests)
2. `npm run dist` — PASS
3. `npm run clean:dist:stale` — cleaned v1.6.7 artifacts
4. `npm run release:gate` — PASS (all steps)

## Launch Proofs

- Dev launch (`npx electron .`) → renderer process spawned → `WINDOW_SHOWN` in security log ✓
- Packed launch (`win-unpacked/HyperSnatch.exe`) with clean user state → 2 renderer processes ✓

## Identity Truth

- `package.json` version = `1.6.8`
- `VERSION.json` version = `1.6.8`, codename = `Insane Mode`
- `APP_VERSION_FALLBACK` = `1.6.8`
- UI badge `#uiVer` = `v1.6.8`

## What v1.6.8 Fixed

**Window never appeared on launch (BrowserWindow not shown)**

Two issues prevented the window from becoming visible after the v1.6.7 module-load crashes were fixed:

1. **Missing `show: false`** — `BrowserWindow` was created without `show: false`, so `ready-to-show` had undefined behavior. Added `show: false` so visibility is controlled exclusively by the `ready-to-show` handler.

2. **`executeJavaScript` before `loadFile`** — The `WINDOW_CREATED` security log call was passing `mainWindow.webContents.executeJavaScript(...)` as a value before `loadFile()`. Calling `executeJavaScript` on an unloaded `webContents` returns a never-settling Promise and can corrupt the webContents state, preventing `ready-to-show` from firing. Removed the `executeJavaScript` call; `rendererPath` is now logged as a plain string.

3. **Added `did-fail-load` handler** — Logs renderer load failures to security log and forces `show()` as a fallback so the user is never left with a silent invisible window.

## Hotfix Chain

| Version | Fix |
|---------|-----|
| v1.6.7  | Missing `IntelligenceGraph` require; `secp256k1` → `prime256v1`; `requestSingleInstanceLock` placement |
| v1.6.8  | `show: false` + remove `executeJavaScript` before `loadFile`; `did-fail-load` handler |

## Publish Checklist

- [x] `release:gate` PASS
- [x] 93/93 E2E tests green
- [x] Dev launch → `WINDOW_SHOWN` verified
- [x] Packed clean-state launch → renderer process verified
- [x] Annotated tag `v1.6.8`
- [x] MANIFEST.json with SHA256 hashes generated
- [ ] `git push origin main`
- [ ] `git push origin v1.6.8`
- [ ] GitHub Release created with installer attached
- [ ] Post-download SHA256 hash verified
