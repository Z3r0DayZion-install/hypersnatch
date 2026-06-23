# HyperSnatch v1.6.18 — Launch Receipt

**Date:** 2026-06-23  
**Status:** Safe to promote

---

## Release URL

```
https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.18
```

---

## Download SHA256

```
698377b36c5d09f63dbf51dd7d9eb7856f9bfd1a59307e23065a5840368ddcec  HyperSnatch-Setup-1.6.18.exe
64055d7fc8a964101d980945d48bd4f26ffdd0cd3c8ecdc9e06599be2d613435  HyperSnatch_Vanguard_v1.6.18.zip
```

Source: `SHA256SUMS.txt` uploaded to GitHub release and verified independently.

---

## Public-Download Sanity Result

| Step | Result |
|---|---|
| Downloaded from public GitHub release URL | ✅ |
| Download size | 77,900,251 bytes — matches GitHub reported size |
| Downloaded installer SHA256 | `698377b3...` — **EXACT MATCH** to published hash |
| SHA256SUMS.txt downloaded and compared | ✅ Consistent |

---

## Installed Version Proof

| Location | Value | Result |
|---|---|---|
| Windows registry `DisplayVersion` | `1.6.18` | ✅ |
| Installed `HyperSnatch.exe` SHA256 | `af2b1ca2bcdf7a81c8a29932977c107d0355ea219f5b514727e7d361d8c7ee1a` | ✅ matches SHA256SUMS.txt |
| `package.json` inside installed asar | `1.6.18` | ✅ |
| `APP_VERSION_FALLBACK` inside installed asar | `1.6.18` | ✅ |
| `#footerVersion` in installed UI | `v1.6.18` | ✅ |
| `#uiVer` badge in installed UI | `v1.6.18` | ✅ |

---

## Receipt Explanation Mode Proof

| Check | Result |
|---|---|
| Tab bar IDs present (`rcptTabBtnDetails`, `rcptTabBtnExplain`, `rcptTabBtnRaw`) | ✅ |
| Explanation panel present (`rcptPanelExplain`) | ✅ |
| "What this receipt proves" section | ✅ |
| "What this receipt does not prove" section | ✅ |
| "How to verify" section | ✅ |
| Related proof files list (`rcptRelatedFiles`) | ✅ |
| Sample receipt note (`rcptExplainSampleNote`) | ✅ |
| Proof vocabulary present (`hash-verified`, `local-first`, `tamper-evident`) | ✅ |
| `court-certified` in explanation panel | ✅ absent |
| `tamper-proof` in explanation panel | ✅ absent |
| `chain-of-custody` in explanation panel | ✅ absent |
| E2E test 91 (receipt explanation mode) | ✅ PASS |

---

## Evidence Nutrition Label Proof

| Check | Result |
|---|---|
| `evidenceNutritionLabel` section present in installed asar | ✅ |
| ENL CSS classes (`enl-section`, `enl-explain`) present | ✅ |

---

## Proof Bundle Diff Proof

| Check | Result |
|---|---|
| `proofBundleDiffCard` section present in installed asar | ✅ |
| "Proof Bundle Diff" label present | ✅ |

---

## Offline Verifier Proof

| Check | Result |
|---|---|
| `VERIFY-HYPERSNATCH` reference present in installed UI | ✅ |
| Offline verifier bundled in every exported proof bundle | ✅ (confirmed by `verify:ui` gate) |

---

## Tamper Trial Proof

| Check | Result |
|---|---|
| Tamper Trial button present in installed asar | ✅ |
| Prove It Again button present | ✅ |
| Proof Passport present | ✅ |

---

## Console / CSP Result

| Check | Result |
|---|---|
| No inline `<script>` blocks in renderer HTML | ✅ |
| CSP enforced via Electron `webRequest` handler | ✅ |
| `contextIsolation` ENABLED | ✅ |
| `nodeIntegration` DISABLED | ✅ |
| `webSecurity` ENABLED | ✅ |
| `style-src` inline styles | intentionally deferred — known limitation |

---

## Gate Summary

| Gate | Result |
|---|---|
| `npm run preflight` | ✅ PASS |
| `npm test` (99/99) | ✅ PASS |
| `npm run verify:ui` | ✅ PASS |
| `npm run verify:asar` | ✅ PASS (485 entries, window visible) |
| `npm run release:gate` (all 7 steps) | ✅ PASS |
| E2E receipt explanation mode test (test 91) | ✅ PASS |

---

## Safe-to-Promote Verdict

**v1.6.18 is safe to promote.**

- Public download hash matches local build exactly
- Installed version truth is `1.6.18` in all locations
- Receipt Explanation Mode is present and verified
- Full proof stack (ENL, Bundle Diff, Offline Verifier, Tamper Trial, Proof Passport) is present
- No overclaim language in any user-facing proof surface
- Security posture unchanged from v1.6.17

---

## Promotion Positioning

```
HyperSnatch v1.6.18 — local-first proof workstation with receipt explanations,
proof bundle diff, offline verification, and tamper trial.
```

**Post angle:**
> v1.6.18 turns proof receipts into something normal users can understand:
> what it proves, what it does not prove, and how to verify it.

**Honest limitation:**
> style-src still allows inline styles and remains intentionally deferred.

**Do not use:**
> court-certified · chain-of-custody · tamper-proof · legal evidence platform

---

## What Is Not Claimed

This launch receipt does not claim court admissibility, legal chain of custody,
forensic certification, or tamper-proof evidence. HyperSnatch produces
self-verifying, receipt-backed proof bundles. Interpretation for legal or
formal use is the operator's responsibility.
