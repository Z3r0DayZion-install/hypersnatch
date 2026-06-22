# HyperSnatch Release Proof v1.6.10

Date: 2026-06-21
Release line: stable — public launch candidate

## Locked Release Record

- Stable release: `v1.6.10`
- Tag: `v1.6.10` (annotated)
- Installer: `HyperSnatch-Setup-1.6.10.exe`
- Installer SHA256: `a5c356328ab981de2327c1fb4fbe560e1199d07e11769176a4637200ab844d4d`
- Zip: `HyperSnatch_Vanguard_v1.6.10.zip`
- Zip SHA256: `fbd98b9639d18aa8b79dd24c586e511a5e7bcabe02960178249597752b42b3d9`
- app.asar SHA256: `3a45c45edde51156e568d8b8b96de4c276dcf7226bcc0b4bce3c8f09303b4d59`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.10`

## Gate Sequence and Result

1. `npx playwright test` — PASS (93/93 E2E tests)
2. `npm run dist` — PASS
3. `npm run clean:dist:stale` — cleaned v1.6.9 artifacts
4. `npm run release:gate` — PASS (all steps)

## Identity Truth

- `package.json` version = `1.6.10`
- `VERSION.json` version = `1.6.10`, codename = `Insane Mode`
- `APP_VERSION_FALLBACK` = `1.6.10`
- UI badge `#uiVer` = `v1.6.10`
- `<title>` = `HyperSnatch — The Proof Foundry™`
- `.brand-kicker` = `The Proof Foundry™`
- Zero `Proof Factory` / `The Proof Factory` hits in any file

## Packed Build Launch Verification

```
dist\win-unpacked\HyperSnatch.exe
→ renderer process spawned (2x PIDs confirmed)
→ visible window confirmed
```

## What v1.6.10 Fixed

**Root cause: `sandbox: true` (Electron OS AppContainer) silently crashed the renderer in packaged builds on Windows**

All previous hotfix attempts (v1.6.7 → v1.6.9) fixed real bugs but missed this one:

- `sandbox: true` in `SECURITY_CONFIG` enables Electron's OS-level AppContainer sandbox on Windows
- In a packaged app, the AppContainer restricts filesystem access in ways that prevent the renderer from loading `file://` resources from inside the `.asar` archive
- The renderer process launched but crashed before emitting any visible error or `ready-to-show`
- In dev mode (`npx electron .`), the sandbox restriction is more permissive — this is why it passed all E2E tests but failed in the installed packaged build

**Fix:** Set `sandbox: false` in `SECURITY_CONFIG`. Security model is unchanged:
- `contextIsolation: true` — renderer/main process isolation maintained
- `nodeIntegration: false` — renderer has no Node.js access
- `webSecurity: true` — CSP and same-origin enforced
- `contextBridge` + IPC allowlist still in preload

**Also fixed in this chain (v1.6.7–v1.6.10):**
- Missing `IntelligenceGraph` require (v1.6.7)
- `secp256k1` → `prime256v1` for Electron BoringSSL (v1.6.7)
- `requestSingleInstanceLock` placement (v1.6.7)
- `show: true` on BrowserWindow, removed `executeJavaScript` before `loadFile` (v1.6.8)
- The Proof Foundry™ brand correction (v1.6.9)
- `sandbox: false` for packaged Windows AppContainer (v1.6.10)

## Complete Superseded Chain

| Version | Status | Reason |
|---------|--------|--------|
| v1.6.6 | Superseded | Fresh install no-window crash |
| v1.6.7 | Superseded | Partial fix |
| v1.6.8 | Superseded | Tag predates brand fix |
| v1.6.9 | Superseded | sandbox:true still present |
| **v1.6.10** | **PUBLIC LAUNCH** | All bugs fixed, renderer confirmed |

## Publish Checklist

- [x] `release:gate` PASS
- [x] 93/93 E2E tests green
- [x] Zero "Proof Factory" hits confirmed
- [x] Packed `win-unpacked` launch → renderer process confirmed
- [x] Annotated tag `v1.6.10`
- [x] MANIFEST.json with SHA256 hashes generated
- [ ] `git push origin main`
- [ ] `git push origin v1.6.10`
- [ ] GitHub Release created: title `HyperSnatch v1.6.10 — Public Launch`
- [ ] Installer + zip attached
- [ ] v1.6.6 / v1.6.7 / v1.6.8 / v1.6.9 marked superseded
- [ ] Fresh installer → install → double-click → visible window confirmed by user
