# HyperSnatch v1.6.14 — Final Release Receipt

**v1.6.14 supersedes v1.6.13 as the public release.**

## Release reason

`v1.6.14 = Settings + alive controls + responsive rails + calmer idle state`

v1.6.13 worked technically but still felt dead when users clicked around. v1.6.14 is a UI-aliveness hotfix: every visible control now does something real, explains why it cannot act yet, or is visually informational, and the idle state reads calm instead of broken.

## Commits

- Base `main` before cut: `b88163a7` (Merge PR #56 — responsive rails + calmer idle state)
- Lanes folded into this release:
  - PR #55 `41b75df2` — Settings + alive controls
  - PR #56 `b88163a7` — responsive rails + calmer idle state
- Tag target: the v1.6.14 release commit on `main` created by this cut (version bump + receipt + README).
- Tag: `v1.6.14` (annotated)

## Version truth (1.6.13 -> 1.6.14)

| Surface | Value |
| --- | --- |
| `package.json` version | 1.6.14 |
| `package-lock.json` (root + package) | 1.6.14 |
| `VERSION.json` | 1.6.14 |
| UI badge `#uiVer` | v1.6.14 |
| Footer `#footerVersion` | v1.6.14 |
| Settings `#setVersion` | v1.6.14 |
| UI `APP_VERSION_FALLBACK` | 1.6.14 |
| IPC `getAppInfo().version` (packaged) | 1.6.14 |
| Installer file name | HyperSnatch-Setup-1.6.14.exe |

Zero stale runtime `1.6.13` remain. Historical docs and prior receipts intentionally still reference earlier versions.

## Gates

| Gate | Result |
| --- | --- |
| `npm run verify:ui` | PASS |
| `npm test` | PASS (smartdecode + dns_fallback 16 + decode_queue 8) |
| `npm run verify:asar` | PASS (69 modules present, visible window confirmed) |
| `npm run release:gate` | PASS — preflight, test, verify:ui, build:wrapper, verify, verify:asar, audit:stable all PASS |

## Packaged click audit (real packaged binary `dist/win-unpacked/HyperSnatch.exe`, CDP port 9233)

```
title: HyperSnatch — The Proof Foundry™
uiVer badge: v1.6.14   footerVersion: v1.6.14   IPC getAppInfo().version: 1.6.14
radarStatus: Ready
psEvidence: Waiting for evidence   psCase: No case loaded yet
psHash: Waiting   psExport: Not ready yet
footerCase: No case loaded yet   lrSessionPath: No evidence loaded yet
no red idle pills: YES
Settings opens via gear: YES   via brand: YES   via version badge: YES   closes: YES
setVersion: v1.6.14   CSP shown: script-src 'self' — no unsafe-inline
reset action feedback: "Session UI reset."
bridge indicator responds: YES
Verify button responds (reason): "Load evidence first — Verify then checks the artifact bundle."
Evidence Source Path responds: "No evidence loaded yet — load a target folder or open the sample proof workspace."
Proof Status pill explains: "Hash: SHA-256 of the captured artifact. Created after you run a decode. (Currently: Waiting)"
CSP violations: 0
console errors: 0
page exceptions: 0
```

Required proof checklist:

- App opens visible window: **YES**
- Settings opens and closes: **YES**
- Gear button responds: **YES**
- Brand / version badge responds: **YES**
- Bridge indicator gives feedback: **YES**
- Verify button gives reason/action: **YES**
- Evidence Source Path responds: **YES**
- Proof Status pills explain themselves: **YES**
- Clear / reset actions give visible status: **YES**
- Top/bottom/left/right visible controls are not silent: **YES**
- Idle state calm (Ready / Waiting / No case loaded yet): **YES**
- Badge / footer / IPC = 1.6.14: **YES**
- 0 CSP violations: **YES**
- 0 page errors: **YES**
- `script-src` remains `'self'` without `unsafe-inline`: **YES**

## CSP proof

Renderer enforces `script-src 'self'` (no `unsafe-inline`). All renderer interactivity is in the external `ui/hypersnatch-ui.js` via `addEventListener`. The packaged audit recorded zero CSP violations across Settings, rails, and control interactions.

## Artifacts and SHA256

```
0e48ea080ab6c3bb1c05de7d06d99a7c7c26ad5103cd21b9ba756b3026658d2a  HyperSnatch-Setup-1.6.14.exe          (77,878,877 bytes)
9846f526cfc945c097b5f0e1c3c733620481cdf6d44c7263140a78a09f1a0571  HyperSnatch-Setup-1.6.14.exe.blockmap (82,362 bytes)
40d838e3f5f3171a2bf7ce12bdb40c566c7a7f919853c6494dbca93327c2c19c  HyperSnatch_Vanguard_v1.6.14.zip      (77,530,615 bytes)
```

## Honest limitation

`style-src` still allows inline styles and remains intentionally deferred. This release does not touch the style-src lane.

## Supersession

HyperSnatch **v1.6.14 supersedes v1.6.13**. Once published, v1.6.14 is the latest release.
