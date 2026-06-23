# HyperSnatch v1.6.13 — Final Release Receipt

**v1.6.13 supersedes v1.6.12 as the public release.**

## Identity

- Branch cut from: `main`
- Base commit (version truth + RC proof): `c4bc9b83`
- Tag target: the final `main` commit containing version truth and this release receipt
- Tag: `v1.6.13` (annotated)
- Date: 2026-06-22
- Builder: electron-builder 24.13.3, electron 28.3.3, win32 x64

## Release reason

`v1.6.13 = brand/icon + workbench-first IA + sample proof workspace + strict script CSP`

- New Proof Foundry / HyperSnatch brand kit and app icon
- Workbench-first UI for clearer first use
- Sample proof workspace / demo case
- Strict script CSP: renderer JavaScript moved out of inline HTML; `script-src 'self'`

## Version truth (1.6.12 -> 1.6.13)

`package.json`, `package-lock.json`, `VERSION.json`, UI `#uiVer` badge, `#footerVersion`,
`APP_VERSION_FALLBACK`, and packaged IPC `getAppInfo().version` all report `1.6.13`.
Repo-wide scan for stale runtime `1.6.12` across runtime/source files: **0 matches**.

## Gates — full release gate (`npm run release:gate`)

| Step | Result |
| --- | --- |
| preflight | PASS |
| test (smartdecode + DNS fallback + decode queue) | PASS |
| verify:ui (UI smoke + CSP contract) | PASS |
| build:wrapper (installer + Vanguard zip + manifest) | PASS |
| verify (packaged artifact + UI/runtime + binary trust boundary) | PASS |
| verify:asar (asar module completeness + visible window) | PASS |
| audit:stable (strict stable signoff) | PASS — **SIGNOFF STATUS: APPROVED** |

Gate verdict: `RELEASE GATE: PASS — all steps passed; safe to tag and release`.

## Packaged interaction proof (CDP against the freshly built asar)

Source: `dist/win-unpacked/HyperSnatch.exe` (renderer served from `app.asar`).

```
pageUrl: file:///.../dist/win-unpacked/resources/app.asar/ui/hypersnatch-ui.html
title: HyperSnatch — The Proof Foundry™
externalScriptFromAsar (hypersnatch-ui.js): true
rendererInit (window.caseMgr): object
uiVer badge: v1.6.13   footerVersion: v1.6.13
click Cases tab -> aria-selected false -> true, panel display -> block
ipc getAppInfo().version: 1.6.13
cspViolations: []   pageErrors: []
```

- Packaged app opens a visible window: **YES** (`MainWindowTitle = HyperSnatch — The Proof Foundry™`)
- Renderer initializes; external `hypersnatch-ui.js` loads from packaged asar: **YES**
- Real click changes UI state: **YES**
- Core IPC `getAppInfo` returns 1.6.13: **YES**
- 0 CSP violations / 0 page errors: **YES**

## CSP proof

- `src/main.js` CSP `script-src 'self'` — **no `unsafe-inline`**.
- `style-src 'self' 'unsafe-inline'` — intentionally deferred to a future hardening lane (UI relies on many inline `style="..."` attributes).
- No inline `<script>` blocks and no inline event handlers in the renderer (enforced by `scripts/ui_smoke_check.js`).

## Icon proof

- Build config `win.icon` / `nsis.installerIcon` = `assets/icons/icon.ico` (370,070 bytes).
- Packaged `HyperSnatch.exe` embeds an icon resource (extracted 32x32 via `System.Drawing.Icon`).

## Sample proof workspace inclusion

- Shipped as an electron-builder `extraResource` (data only; no code/UI behavior change).
- Present in package: `dist/win-unpacked/resources/samples/demo-case/` — 12 files (`proof/manifest.json`, `proof/SHA256SUMS.txt`, `proof/receipt.json`, `captured-page/`, `artifacts/`).

## Final release artifacts + SHA256

```
78ab2fee40ae3136a09cb57a587363620ee8d1de314a82059e9cc0bce1e73a24  HyperSnatch-Setup-1.6.13.exe          (77,877,799 bytes)
83528b68408b289ff9f956566a26e96452944c9d2f02319ae68540c87a1bc8db  HyperSnatch-Setup-1.6.13.exe.blockmap (82,479 bytes)
0cdebc87e32679ca66af0103917218e154179a33c37e0dcb84ce4b8d14d5c3f3  HyperSnatch_Vanguard_v1.6.13.zip      (77,529,527 bytes)
67d74df50091cedd50af96e7aabe9090c36150bb60a23e238d56e8adbcc94d96  app.asar                              (4,669,788 bytes)
```

Authoritative checksum file: `dist/SHA256SUMS.txt` (gate-generated; independently re-verified).

## Limitation (honest note)

`style-src` still allows inline styles and is intentionally deferred to a future lane.

## Supersede

HyperSnatch **v1.6.13 supersedes v1.6.12**. Once published, v1.6.13 is the latest release.

## Launch visibility log

- 2026-06-22 — Hacker News update posted: v1.6.13 live.
  Thread: https://news.ycombinator.com/item?id=48625074
- Reddit: r/windowsapps queued (first subreddit; one at a time, then wait).
