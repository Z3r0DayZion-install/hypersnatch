# HyperSnatch v1.6.17 — Final Release Receipt

**v1.6.17 supersedes v1.6.16 as the public release.**

## Release Reason

`v1.6.17 = proof comparison + proof clarity`

## Release Metadata

- Branch: `release/v1.6.17`
- Main commit: `d94ff93a` (pre-release baseline)
- Tag: `v1.6.17` (annotated, targeting merge commit)
- Date: 2026-06-23

## Version Truth (1.6.16 → 1.6.17)

| Location | Value |
|----------|-------|
| `package.json` version | 1.6.17 |
| `package-lock.json` (root + package) | 1.6.17 |
| `VERSION.json` | 1.6.17 |
| UI badge `#uiVer` | v1.6.17 |
| Footer `#footerVersion` | v1.6.17 |
| Settings `#setVersion` | v1.6.17 |
| UI `APP_VERSION_FALLBACK` | 1.6.17 |
| IPC `getAppInfo().version` (packaged) | 1.6.17 |
| Installer file name | HyperSnatch-Setup-1.6.17.exe |
| Vanguard zip name | HyperSnatch_Vanguard_v1.6.17.zip |
| README badge + download + verify + history | v1.6.17 |

## Features Merged into v1.6.17 (since v1.6.16)

- **PR #67 — Proof Bundle Diff:** Compare two exported proof bundles and see same/changed/added/removed files. Recomputes actual on-disk SHA-256 of every corpus file in both bundles. Passport differences reported separately. User must explicitly pick both folders; no network, no recursive scan. Schema: `hypersnatch.proof_bundle_diff.v1`.
- **PR #69 — Repo hygiene cleanup:** Removed ~723 tracked stale files across 56 directories (old dev packs, temp phase dirs, old test folders, stale scripts, marketing/marketplace, root junk). 3 historical docs moved to `docs/archive/`. Zero dangling references confirmed. Audit: `docs/release/REPO_HYGIENE_AUDIT_AFTER_v1.6.16.md`.
- **PR #68 — Evidence Nutrition Label:** Plain-language proof-quality summary card (four sections: Proof Contents, Verification, Privacy/Claims, plain-English explanation). Hooks into existing passport export callbacks. Render-only; no main/preload IPC changes. Honest language only — no court/chain-of-custody claims.

## Gates

| Gate | Result |
|------|--------|
| `verify:ui` | PASS — UI shell and critical IDs present |
| `npm test` | PASS — 8/8 decode queue tests |
| `verify:asar` | PASS — modules complete, window visible |
| `release:gate` | PASS — all 7 steps (preflight, test, verify:ui, build:wrapper, verify, verify:asar, audit:stable) |

## Packaged CDP Release Proof (v1.6.17)

```
[1]  Version: IPC=1.6.17  badge=v1.6.17  footer=v1.6.17  OK
[2]  Theme persist: terminal-green  OK
[3]  Evidence Nutrition Label: hidden before sample  OK
[4]  Sample: 5 artifacts  5 hashes  1 receipt  OK
[5]  Evidence Nutrition Label: appears after sample (status=Not exported yet)  OK
[6]  Export A: 10 files  OK
[7]  Export B: 10 files  OK
[8]  SHA256SUMS: 10 entries  OK
[9]  Repo hygiene in export: 0 files  OK

[10] Proof Passport:
     schema = hypersnatch.proof_passport.v1
     app_version = 1.6.17
     verifier_included = true
     cloud_required = No
     OK

[11] Evidence Nutrition Label after export:
     status = Clean
     verifier = Included
     passport = Present
     OK

[12] Prove It Again: clean 10/10  OK

[13] Tamper Trial: 4/4 caught  OK
     original export clean after trial  OK

[14] Proof Bundle Diff:
     self-compare: 10 same, 0 changed → Bundles match  OK
     modified hash detected: changed ≥ 1, Needs review, DOM row rendered  OK
     removed file detected: removed ≥ 1, Needs review  OK
     invalid folder rejected: error returned  OK

[15] Offline Capsule verifier:
     opens from file:// in clean browser  OK
     crypto.subtle available  OK
     in-page SHA-256 matches Node hash  OK
     0 external/network refs  OK

[16] Receipt viewer: opens (flex)  OK

[17] Console: 0 errors  OK
[18] CSP: script-src 'self' (no unsafe-inline), style-src inline deferred  OK
```

**Result: pass:true**

## CSP Confirmation

- `script-src 'self'` — no unsafe-inline
- `style-src 'self' 'unsafe-inline'` — inline styles intentionally deferred (honest limitation, unchanged since v1.6.15)

## Artifact Hashes

```
87811e1aebf83d14aaa532630b41e50cd61dc26251442c83ddf8a8a805379ec0  HyperSnatch-Setup-1.6.17.exe          (77,899,069 bytes)
0d895fab283434aedf40b713bcfea1aa4e74a7ee0de707bc50684d734f80ad97  HyperSnatch-Setup-1.6.17.exe.blockmap (82,549 bytes)
8e24551a9a01344a6d3ec0e4bd60cd50f21bb3a374cf5a073e0710c4d9db7e82  HyperSnatch_Vanguard_v1.6.17.zip      (77,550,572 bytes)
```

## Claims

HyperSnatch **v1.6.17 supersedes v1.6.16**. Once published, v1.6.17 is the latest release.

Honest limitation: `style-src` still allows inline styles and remains intentionally deferred. No court certification, chain-of-custody, or legal admissibility claimed. This is a tamper-evident, self-verifying export tool — not legal evidence.

---

**Receipt generated:** 2026-06-23
**Co-authored-by:** factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
