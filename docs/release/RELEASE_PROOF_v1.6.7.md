# HyperSnatch Release Proof v1.6.7

Date: 2026-06-21
Release line: stable (critical bugfix)

## Locked Release Record

- Stable release: `v1.6.7`
- Commit SHA: `3b9b64e1`
- Tag: `v1.6.7` (annotated)
- Installer: `HyperSnatch-Setup-1.6.7.exe`
- Installer SHA256: `6c0810cfabf7072441980fa32e86b6e2d7b88941c5f5dfd3fafbd842c2de3ffa`
- Zip artifact: `HyperSnatch_Vanguard_v1.6.7.zip`
- Zip SHA256: `413c051008f4d8fdbc8ae142e2f7c9e75a682065ba630a137ac61daac9aaa649`
- app.asar SHA256: `6410f2556f80d7fad2d88ea1f2d31f94b73505375310127467f87d632d0b48ad`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.7`

## Gate Sequence and Result

1. `npm run dist` — PASS
2. `npm run clean:dist:stale` — cleaned v1.6.6 artifacts
3. `npx playwright test` — PASS (93/93 E2E tests)
4. `npm run release:gate` — PASS (all steps)

## Identity Truth

- `package.json` version = `1.6.7`
- `VERSION.json` version = `1.6.7`, codename = `Insane Mode`
- `APP_VERSION_FALLBACK` in `hypersnatch-ui.html` = `1.6.7`
- UI badge `#uiVer` = `v1.6.7`
- Built artifact names contain `1.6.7`
- `git status --short` = clean

## What v1.6.7 Fixed

### Critical: App would not launch (no window) on fresh install

Two stacked startup crashes, both occurring at module load time before
`app.whenReady()` ever fired. No window was produced; only gpu-process
and network utility child processes started.

**Bug 1 — `ReferenceError: IntelligenceGraph is not defined`**
- Location: `src/main.js:452` — `const intelGraph = new IntelligenceGraph()`
- Cause: `IntelligenceGraph` was used at module scope but its `require`
  for `./intelligence/intelligenceGraph` was never added to `main.js`.
- Fix: Added `const IntelligenceGraph = require('./intelligence/intelligenceGraph')`

**Bug 2 — `Error: UNKNOWN_GROUP (secp256k1)` in `BundleSigner.ensureKeyPair`**
- Location: `src/audit/bundleSigner.js:29`
- Cause: Electron ships BoringSSL (not OpenSSL). BoringSSL does not
  support `secp256k1` (Bitcoin's curve). `crypto.generateKeyPairSync`
  threw on first launch when no key files existed.
- Fix: Replaced `namedCurve: 'secp256k1'` with `namedCurve: 'prime256v1'`
  (NIST P-256), which BoringSSL fully supports.

**Bonus: `requestSingleInstanceLock` placement**
- Moved to before `app.whenReady()` per Electron docs. Previously called
  inside `whenReady()`, which is incorrect.

### Note on v1.6.6 artifacts

v1.6.6 was tagged and published but affected by these crashes on any
machine without pre-existing runtime keys from a prior build. v1.6.7
supersedes v1.6.6 as the correct stable release.

## Publish Checklist

- [x] `release:gate` PASS
- [x] 93/93 E2E tests green
- [x] Annotated tag `v1.6.7` on `3b9b64e1`
- [x] MANIFEST.json with SHA256 hashes generated
- [ ] `git push origin main`
- [ ] `git push origin v1.6.7`
- [ ] GitHub Release created with installer + zip attached
- [ ] Post-download SHA256 hash verified against MANIFEST.json
