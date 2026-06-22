# HyperSnatch Release Proof v1.6.11

Date: 2026-06-21
Release line: stable — public launch candidate

## Locked Release Record

- Stable release: `v1.6.11`
- Tag: `v1.6.11` (annotated)
- Installer: `HyperSnatch-Setup-1.6.11.exe`
- Installer SHA256: `7757217586fa23612e6cabb17940079b43a19009c5146b30944f7b950112da7b`
- Zip: `HyperSnatch_Vanguard_v1.6.11.zip`
- Zip SHA256: `78f4aadf6fd58763f6e81b93848212adfb7b1558099b250e4a9672e8d0ca43cc`
- app.asar SHA256: `a1efba81d998abffc1ee375cf8fc142d03816dd9e31dc2cfa7d2e500d89e9f77`
- app.asar size: 4,655,200 bytes (was 4,389,221 — +266 KB of previously missing modules)
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.11`

## Gate Sequence and Result

1. `npx playwright test` — PASS (93/93 E2E tests)
2. `npm run dist` — PASS
3. `npm run clean:dist:stale` — cleaned v1.6.10 artifacts
4. `npm run release:gate` — PASS (all steps)

## Identity Truth

- `package.json` version = `1.6.11`
- `VERSION.json` version = `1.6.11`, codename = `Insane Mode`
- `APP_VERSION_FALLBACK` = `1.6.11`
- UI badge `#uiVer` = `v1.6.11`
- `<title>` = `HyperSnatch — The Proof Foundry™`
- `.brand-kicker` = `The Proof Foundry™`
- Zero `Proof Factory` / `The Proof Factory` hits in any file

## Packed Build Launch Verification

```
dist\win-unpacked\HyperSnatch.exe
→ MainWindowHandle: 984672
→ MainWindowTitle:  HyperSnatch — The Proof Foundry™
→ Window visible: CONFIRMED
```

## Root Cause — Why v1.6.6 Through v1.6.10 All Failed on Fresh Install

**The electron-builder `files` list in `package.json` was an explicit allowlist that omitted all `src/` subdirectories.**

Original list:
```json
"src/main.js",
"src/preload.js",
"src/security-crypto.js",
"src/dompurify.js",
"src/utils/logger.js",
"src/utils/crash-logger.js",
"src/core/",
...
```

`main.js` requires modules from 20+ subdirectories at startup:
`automation/`, `cases/`, `audit/`, `intelligence/`, `plugins/`, `query/`,
`replay/`, `rules/`, `research/`, `export/`, `assistant/`, `autonomy/`,
`ai/`, `library/`, `workspaces/`, `federation/`, `graph/`, `policy/`,
`enterprise/`, `collaboration/`, `redaction/`, `publication/`, `reporting/`

None were in the `files` list. None were packed into the asar. The app crashed
at line 191 (`require('./automation/clipboardWatcher')`) before `app.whenReady()`
could ever fire — no window, no error dialog, no visible indication.

**In dev mode (`npx electron .`) the build system reads directly from the
filesystem, so all modules existed. Every E2E test passed. The crash only
manifested in the packed asar.**

**Fix:** Replace explicit list with `src/**/*`:
```json
"files": [
  "src/**/*",
  "core/",
  "modules/",
  "ui/hypersnatch-ui.html",
  "package.json"
]
```

## Complete Superseded Chain

| Version | Status | Root Bug |
|---------|--------|----------|
| v1.6.6 | Superseded | Missing module require + no-window (same underlying bug, different surface) |
| v1.6.7 | Superseded | Fixed IntelligenceGraph/secp256k1 but asar still incomplete |
| v1.6.8 | Superseded | Fixed executeJavaScript/show:false but asar still incomplete |
| v1.6.9 | Superseded | Fixed brand but asar still incomplete |
| v1.6.10 | Superseded | Fixed sandbox:false but asar still incomplete |
| **v1.6.11** | **PUBLIC LAUNCH** | Fixed asar files list — all modules packed |

## Publish Checklist

- [x] `release:gate` PASS
- [x] 93/93 E2E tests green
- [x] Zero "Proof Factory" hits confirmed
- [x] `win-unpacked` launch: window visible, title = `HyperSnatch — The Proof Foundry™`
- [x] Annotated tag `v1.6.11`
- [x] MANIFEST.json with SHA256 hashes generated
- [x] `git push origin main`
- [x] `git push origin v1.6.11`
- [x] Run installer `HyperSnatch-Setup-1.6.11.exe` → install → double-click → **PASS**
      MainWindowHandle: 2233720 | MainWindowTitle: HyperSnatch — The Proof Foundry™
- [x] GitHub Release: title `HyperSnatch v1.6.11 — Public Launch` — PUBLISHED
      https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.11
- [x] Upload `HyperSnatch-Setup-1.6.11.exe` + `HyperSnatch_Vanguard_v1.6.11.zip` — via `gh release create`
- [x] v1.6.6–v1.6.10 marked superseded on GitHub
      (v1.6.6 + v1.6.8 had release pages — both updated; v1.6.7/v1.6.9/v1.6.10 had no release pages, tags only)
- [x] Post-download SHA256 verified from GitHub
      Installer: 7757217586FA23612E6CABB17940079B43A19009C5146B30944F7B950112DA7B ✅
      Zip:       78F4AADF6FD58763F6E81B93848212ADFB7B1558099B250E4A9672E8D0CA43CC ✅
- [x] HN post — PUBLISHED
      https://news.ycombinator.com/item?id=48625074
      Title: Show HN: HyperSnatch – local-first evidence workstation for Windows
      First comment posted. v1.6.11 launch complete.
