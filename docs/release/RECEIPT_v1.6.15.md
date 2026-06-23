# HyperSnatch v1.6.15 -- Final Release Receipt

**v1.6.15 supersedes v1.6.14 as the public release.**

## Release reason

`v1.6.15 = first-run proof workflow`

A fresh HyperSnatch install now goes from nothing to a real-looking proof workflow in one click: open the app, dismiss the welcome guide, click "Open Sample Proof Workspace", view the receipt, and export the proof bundle. The front-door workbench, window fit, in-app sample workspace, receipt viewer, export proof bundle, onboarding modal, and settings trust surface all work together to make the first run obvious and satisfying.

## Git

- Branch: `release/v1.6.15`
- Main commit (pre-tag): `93b1bc5a`
- Tag target: the version bump + receipt + README commit on `main` created by this cut.
- Tag: `v1.6.15` (annotated)

## Version truth (1.6.14 -> 1.6.15)

| Source | Value |
|---|---|
| `package.json` version | 1.6.15 |
| `package-lock.json` (root + package) | 1.6.15 |
| `VERSION.json` | 1.6.15 |
| UI badge `#uiVer` | v1.6.15 |
| Footer `#footerVersion` | v1.6.15 |
| Settings `#setVersion` | v1.6.15 |
| UI `APP_VERSION_FALLBACK` | 1.6.15 |
| IPC `getAppInfo().version` (packaged) | 1.6.15 |
| Installer file name | HyperSnatch-Setup-1.6.15.exe |

Zero stale 1.6.14 in runtime truth. Only README and historical docs retain 1.6.14 references.

## Features merged into v1.6.15

| PR | Feature |
|---|---|
| #57 | Front-door workbench + window fit (1440x900 default, 1280x800 minimum) |
| #58 | In-app sample proof workspace + receipt viewer |
| #59 | Export proof bundle + first-run onboarding + Settings trust surface |
| #60 | Export bundle hygiene (no repo files, 10-line self-verifying SHA256SUMS) |

## Gates

- `npm run verify:ui` -- PASS
- `npm test` -- PASS (99/99 tests, zero failures)
- `npm run verify:asar` -- PASS (485 entries, 69 modules, window visible)
- `npm run release:gate` -- PASS (all 7 steps: preflight, test, verify:ui, build, verify, verify:asar, audit:stable)

## Packaged CDP release proof (v1.6.15)

All checks against `dist/win-unpacked/HyperSnatch.exe` via CDP port 9241 on a clean user-data launch:

```
[1] Version: badge=v1.6.15 IPC=1.6.15 OK
[2] Onboarding shows/dismisses, localStorage flag set OK
[3] Sample workspace loads: 5 artifacts, 5 hashes, 1 receipt OK
[4] Receipt viewer opens, shows RCPT-DEMO-0001 OK
[5] Export creates HyperSnatch-Proof-Bundle-YYYYMMDD-HHMMSS (10 checksums) OK
[6] Bundle hygiene: 12 files, zero .gitattributes/.gitignore/.git/README.md, 10/10 SHA256SUMS verified OK
[7] openExportFolder IPC returns success OK
[8] Settings: v1.6.15, storage path populated, onboarding reopens OK
[9] Console errors: 0, CSP violations: 0 OK
```

## CSP

`script-src 'self'` preserved throughout all v1.6.15 PRs. No `unsafe-inline`. `style-src` inline allowance remains intentionally deferred.

## Artifacts

```
511F30FB980683514FB6A039A5E9C18AA2C21D18657DEF6BBA41DE91B2FEACB7  HyperSnatch-Setup-1.6.15.exe          (77,881,255 bytes)
CEC92E9B0F48391E0B325BCDC1485E3C848B8261357B92089E5914DDF6BA3F74  HyperSnatch-Setup-1.6.15.exe.blockmap (82,380 bytes)
E24217DA0E3C111E62EB79EE5766A1E309ACCC57252FF964F787D68E6FFBB741  HyperSnatch_Vanguard_v1.6.15.zip      (112,627,988 bytes)
```

## Supersedes

HyperSnatch **v1.6.15 supersedes v1.6.14**. Once published, v1.6.15 is the latest release.
