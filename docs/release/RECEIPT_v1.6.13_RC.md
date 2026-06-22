# HyperSnatch v1.6.13 — Release Candidate Proof Receipt

**Status: RELEASE CANDIDATE — NOT PUBLISHED.** No GitHub release, no tag, no uploaded
artifacts. This receipt records local RC proof only.

## Identity

- Branch: `release/v1.6.13-rc`
- Base commit: `841bc8ba` (main, after PR #53)
- RC commit: the commit that adds this receipt and the version bump
- Date: 2026-06-22
- Builder: electron-builder 24.13.3, electron 28.3.3, win32 x64

## Release reason

`v1.6.13 = brand/icon + workbench-first IA + sample proof workspace + strict script CSP`

Shipped via merged PRs on `main`:

- Brand / icon
- Workbench-first IA (PR #51)
- Sample proof workspace (PR #52)
- Strict script CSP — inline renderer JS extracted, `script-src 'self'` (PR #53)

## Version truth (1.6.12 -> 1.6.13)

Every runtime / version-truth source bumped:

| Source | Value |
| --- | --- |
| `package.json` version | 1.6.13 |
| `package-lock.json` (root + package) | 1.6.13 |
| `VERSION.json` | 1.6.13 |
| UI badge `#uiVer` | v1.6.13 |
| Footer `#footerVersion` | v1.6.13 |
| UI `APP_VERSION_FALLBACK` | 1.6.13 |
| IPC `getAppInfo().version` (packaged) | 1.6.13 |
| Installer file name | HyperSnatch-Setup-1.6.13.exe |

Repo-wide search for stale runtime `1.6.12` across `{*.json,*.js,*.html,*.cjs,src,ui,scripts,build,assets}`: **0 matches**.
(Historical docs / prior launch notes may still reference older versions by design.)

## Gates

| Gate | Command | Result |
| --- | --- | --- |
| UI smoke + CSP contract | `npm run verify:ui` | PASS |
| Unit tests (smartdecode + DNS fallback + decode queue) | `npm test` | PASS (75 + 16 + 8) |
| Packaged module / window gate | `npm run verify:asar` | PASS (485 asar entries, all 69 local requires present, visible window) |

## Packaged runtime proof (CDP against the packaged asar build)

Source: `dist/win-unpacked/HyperSnatch.exe` (renderer served from `app.asar`), driven over Chrome DevTools Protocol.

```
pageUrl: file:///.../dist/win-unpacked/resources/app.asar/ui/hypersnatch-ui.html
title: HyperSnatch — The Proof Foundry™
externalScriptTag (hypersnatch-ui.js): true
rendererInitialized (window.caseMgr): object
uiVer badge: v1.6.13
footerVersion: v1.6.13
click Cases tab -> aria-selected false -> true, panel display -> block
ipc getAppInfo().version: 1.6.13
cspViolations: []
pageErrors: []
```

- Packaged app opens a visible window: **YES** (`MainWindowTitle = HyperSnatch — The Proof Foundry™`)
- Renderer initializes: **YES**
- External `hypersnatch-ui.js` loads from the packaged asar: **YES**
- Real click changes UI state: **YES**
- Core IPC `getAppInfo` returns 1.6.13: **YES**
- 0 CSP violations / 0 page errors: **YES**

## CSP proof

- `src/main.js` CSP `script-src 'self'` — **no `unsafe-inline`**.
- `style-src 'self' 'unsafe-inline'` — intentionally deferred to a separate hardening lane (UI relies on many inline `style="..."` attributes; out of scope for this RC).
- No inline `<script>` blocks and no inline event handlers in the renderer (enforced by `scripts/ui_smoke_check.js`).

## Icon proof

- Build config `win.icon` / `nsis.installerIcon` = `assets/icons/icon.ico` (370,070 bytes).
- Packaged `HyperSnatch.exe` embeds an icon resource (extracted 32x32 via `System.Drawing.Icon`).

## Sample proof workspace inclusion

- Shipped as an electron-builder `extraResource` (data only, no code/UI behavior change).
- Present in package: `dist/win-unpacked/resources/samples/demo-case/` — 12 files, including `proof/manifest.json` (1,894 bytes), `proof/SHA256SUMS.txt`, `proof/receipt.json`, `captured-page/`, and `artifacts/`.

## Local RC artifacts + SHA256

Local-only (under gitignored `dist/`; not committed, not uploaded):

```
34a4d85f2cf6abea4300663ca36c17f8cd0b1232c86aa62cc62cb79e5ce2014b  HyperSnatch-Setup-1.6.13.exe        (77,877,797 bytes)
8db32c8ddba2faf46a89b366ba402539f9264d9670cb5846a707a27095c41108  HyperSnatch-Setup-1.6.13.exe.blockmap (82,456 bytes)
67d74df50091cedd50af96e7aabe9090c36150bb60a23e238d56e8adbcc94d96  app.asar                             (4,669,788 bytes)
```

Checksum file: `dist/SHA256SUMS_v1.6.13_RC.txt` (local artifact).

## Not published

No GitHub release, no tag, no artifact upload. Public release remains `v1.6.12` until this RC proof is reviewed and a publish is explicitly approved.
