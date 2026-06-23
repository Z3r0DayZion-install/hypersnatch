# HyperSnatch v1.6.18 — Release Receipt

## Release Reason

Receipt Explanation Mode — tabbed receipt viewer with plain-English proof explanation.
v1.6.18 supersedes v1.6.17.

---

## Main Commit

```
34992bbc  Merge pull request #70 from Z3r0DayZion-install/feature/receipt-explanation-mode
```

## Release Branch Commit (version bump)

```
2980980a  release: HyperSnatch v1.6.18 (receipt explanation and proof clarity)
```

## Tag Target

```
release/v1.6.18 HEAD @ 2980980a
Tag: v1.6.18
```

---

## Version Truth Audit

| Location | Value |
|---|---|
| `package.json` | `1.6.18` |
| `package-lock.json` (top-level + packages[""]) | `1.6.18` |
| `VERSION.json` | `1.6.18` |
| `ui/hypersnatch-ui.html` — `#uiVer` badge | `v1.6.18` |
| `ui/hypersnatch-ui.html` — `#setVersion` | `v1.6.18` |
| `ui/hypersnatch-ui.html` — `#footerVersion` | `v1.6.18` |
| `ui/hypersnatch-ui.js` — `APP_VERSION_FALLBACK` | `1.6.18` |
| `README.md` — badge, download link, history | `v1.6.18` |
| asar runtime markers (10 checked) | `1.6.18` ✅ |
| IPC `getAppInfo()` — reads from `app.getVersion()` / `package.json` | `1.6.18` ✅ |

---

## Gates Run

| Gate | Result |
|---|---|
| `npm run preflight` | ✅ PASS |
| `npm test` | ✅ PASS (75 + 16 + 8 = 99 tests) |
| `npm run verify:ui` | ✅ PASS |
| `npm run build:wrapper` | ✅ PASS |
| `npm run verify` | ✅ PASS |
| `npm run verify:asar` | ✅ PASS (485 entries, window visible) |
| `npm run audit:stable` | ✅ PASS |
| `npm run release:gate` | ✅ PASS (all 7 steps) |

---

## Packaged Proof

| Check | Result |
|---|---|
| Version badge/footer/IPC = `1.6.18` | ✅ |
| Visible window confirmed | ✅ `HyperSnatch - The Proof Foundry™` |
| asar contains 485 entries | ✅ |
| All 69 required modules present in asar | ✅ |
| `HyperSnatch-Setup-1.6.18.exe` produced | ✅ |
| `HyperSnatch_Vanguard_v1.6.18.zip` produced | ✅ |
| Binary trust boundary class | `unsigned-bounded` (unsigned; artifact/hash proof is primary) |
| Security: contextIsolation ENABLED | ✅ |
| Security: nodeIntegration DISABLED | ✅ |
| Security: webSecurity ENABLED | ✅ |

---

## Receipt Explanation Mode Proof

| Check | Result |
|---|---|
| Tab bar present (`rcptTabBtnDetails`, `rcptTabBtnExplain`, `rcptTabBtnRaw`) | ✅ E2E test 91 |
| Explanation tab switches correctly | ✅ |
| "What this receipt proves" section visible | ✅ |
| "What this receipt does not prove" section visible | ✅ |
| "How to verify" section visible | ✅ |
| Related proof files populated | ✅ |
| Sample receipt note shown when `isSample: true` | ✅ |
| Proof vocabulary present (`hash-verified`, `local-first`, `tamper-evident`) | ✅ |
| Forbidden overclaim language absent (`court-certified`, `tamper-proof`, `legal evidence platform`) | ✅ |
| `chain-of-custody` absent from explanation panel | ✅ (uses unhyphenated "chain of custody" in negation only) |
| Raw / Hashes tab shows SHA256SUMS | ✅ |

---

## Evidence Nutrition Label Proof

| Check | Result |
|---|---|
| ENL element IDs present (`enlModal`, `btnOpenEnl`, etc.) | ✅ `verify:ui` |
| ENL content renders proof quality fields | ✅ |

---

## Proof Bundle Diff Proof

| Check | Result |
|---|---|
| Diff element IDs present (`diffModal`, `btnBundleDiff`, etc.) | ✅ `verify:ui` |

---

## CSP Proof

| Check | Result |
|---|---|
| No inline `<script>` blocks in renderer HTML | ✅ `verify:ui` |
| No inline event handlers in renderer HTML | ✅ `verify:ui` |
| Renderer JS loaded as external file (`hypersnatch-ui.js`) | ✅ |
| `style-src` allows inline styles | intentional — deferred |

---

## Artifact Names

```
HyperSnatch-Setup-1.6.18.exe
HyperSnatch_Vanguard_v1.6.18.zip
SHA256SUMS.txt
```

---

## SHA256 Hashes

```
698377b36c5d09f63dbf51dd7d9eb7856f9bfd1a59307e23065a5840368ddcec  HyperSnatch-Setup-1.6.18.exe
64055d7fc8a964101d980945d48bd4f26ffdd0cd3c8ecdc9e06599be2d613435  HyperSnatch_Vanguard_v1.6.18.zip
bdbe2897e91371b0d68c68bb8a184557573bbd93de7f973610ef02e0d11bdd28  HyperSnatch-Setup-1.6.18.exe.blockmap
af2b1ca2bcdf7a81c8a29932977c107d0355ea219f5b514727e7d361d8c7ee1a  dist/win-unpacked/HyperSnatch.exe
eb013a59396a6a8e59d4cf5862d54c7e02bdbef37331ced48ce4b85d9563186c  dist/win-unpacked/resources/app.asar
```

---

## Supersedes

v1.6.18 supersedes v1.6.17.
v1.6.17 remains available in the release history but is superseded.

---

## Honest Limitation

`style-src` still allows inline styles and remains intentionally deferred.
