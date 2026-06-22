# HyperSnatch Release Proof v1.6.9

Date: 2026-06-21
Release line: stable — public launch candidate

## Locked Release Record

- Stable release: `v1.6.9`
- Tag: `v1.6.9` (annotated)
- Installer: `HyperSnatch-Setup-1.6.9.exe`
- Installer SHA256: `5a0b449a44381a71db6f285a29854aff1b68245703c75e00a982f5122998e086`
- Zip: `HyperSnatch_Vanguard_v1.6.9.zip`
- Zip SHA256: `aad241141d3bcca8d768556f332bb632b4628395ea75f1e1bc21be6d63274d8f`
- app.asar SHA256: `ee2e1f16d36fc3365afaf69a224d24a58d3b411f926d54b6bf2bf1f389fb9fc0`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.9`

## Gate Sequence and Result

1. `npx playwright test` — PASS (93/93 E2E tests)
2. `npm run dist` — PASS
3. `npm run clean:dist:stale` — cleaned v1.6.8 artifacts
4. `npm run release:gate` — PASS (all steps)

## Identity Truth

- `package.json` version = `1.6.9`
- `VERSION.json` version = `1.6.9`, codename = `Insane Mode`
- `APP_VERSION_FALLBACK` = `1.6.9`
- UI badge `#uiVer` = `v1.6.9`
- `<title>` = `HyperSnatch — The Proof Foundry™`
- `.brand-kicker` = `The Proof Foundry™`
- Zero `Proof Factory` / `The Proof Factory` hits in any file

## What v1.6.9 is

v1.6.9 is the clean public launch release. It consolidates all hotfixes
from v1.6.6 → v1.6.8 plus the Proof Foundry brand correction which was
committed after the v1.6.8 tag.

### Complete hotfix chain absorbed

| Version | Fix |
|---------|-----|
| v1.6.7  | Missing `IntelligenceGraph` require; `secp256k1` → `prime256v1` (BoringSSL); `requestSingleInstanceLock` placement |
| v1.6.8  | `show: false` on `BrowserWindow`; removed `executeJavaScript` before `loadFile`; `did-fail-load` handler |
| v1.6.9  | Brand: The Proof Factory → The Proof Foundry™ (UI title, kicker, legal modal, report header, docs, launch posts, README) |

### Why v1.6.8 was superseded

The brand correction commit (`bdced512`) landed after the `v1.6.8` tag
(`3e48923c`). The v1.6.8 installer contained "The Proof Factory" strings.
v1.6.9 is the first tag that includes both the launch fixes and the
correct brand.

## Proof Foundry Brand Verification

```
rg -n "Proof Factory|The Proof Factory" C:\Users\KickA\HyperSnatch_Work
→ 0 results
```

## Publish Checklist

- [x] `release:gate` PASS
- [x] 93/93 E2E tests green
- [x] Zero "Proof Factory" hits confirmed
- [x] Annotated tag `v1.6.9`
- [x] MANIFEST.json with SHA256 hashes generated
- [ ] `git push origin main`
- [ ] `git push origin v1.6.9`
- [ ] GitHub Release created: title `HyperSnatch v1.6.9 — Public Launch`
- [ ] Installer + zip attached to GitHub Release
- [ ] Post-download SHA256 verified before announcing
- [ ] Fresh install → double-click → visible window confirmed
