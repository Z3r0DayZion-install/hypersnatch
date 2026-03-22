# v1.5.10 Dependency Baseline

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`  
Shipped reference line: `v1.5.9`

This document records the current dependency baseline used for release-readiness claims.

## Evidence Inputs

1. `package.json`
2. `package-lock.json` (`lockfileVersion = 3`)
3. `npm ls --depth=0 --json`
4. `docs/dev/DEPENDENCY_WARNING_INVENTORY_v1.5.9.md`

## Production vs Dev Split

- Production dependencies (declared): 2
- Dev dependencies (declared): 5
- Installed lockfile package entries (`node_modules/*`): 335

## Top-Level Baseline Snapshot

| Package | Surface | Declared Range | Installed Version | Posture | Criticality |
|---|---|---|---|---|---|
| `ajv` | production | `6.14.0` | `6.14.0` | pinned | medium (schema validation path) |
| `chrome-remote-interface` | production | `^0.34.0` | `0.34.0` | range | medium (decoder/runtime bridge path) |
| `electron` | dev/build/runtime | `28.3.3` | `28.3.3` | pinned | high (desktop runtime) |
| `electron-builder` | dev/build | `^24.13.3` | `24.13.3` | range | high (release packaging/signoff artifact path) |
| `electron-playwright-helpers` | dev/test | `^2.1.0` | `2.1.0` | range | medium (UI/runtime proof support) |
| `jsdom` | dev/test | `26.1.0` | `26.1.0` | pinned | medium (UI proof/test harness behavior) |
| `playwright` | dev/test | `^1.58.2` | `1.58.2` | range | high (runtime proof/test execution path) |

## Pinning Posture

- Pinned declarations: 3 (`ajv`, `electron`, `jsdom`)
- Range declarations: 4 (`chrome-remote-interface`, `electron-builder`, `electron-playwright-helpers`, `playwright`)

Interpretation:

1. Current resolved state is lockfile-controlled and reproducible for this baseline.
2. Range declarations create future drift potential if lockfile is regenerated without governance controls.

## Critical Packages Called Out

1. `electron`: runtime contract and packaged app behavior.
2. `electron-builder`: installer/bundle generation and release artifact contract.
3. `playwright`: UI/runtime proof confidence.
4. `chrome-remote-interface`: core decode/bridge surface.

## Direct Proof vs Inference Boundary

Direct for this baseline:

1. Declared dependency set in `package.json`.
2. Locked resolved graph shape in `package-lock.json`.
3. Installed top-level versions from `npm ls --depth=0 --json`.

Inferred (not guaranteed by this doc alone):

1. Future warning/deprecation posture after upstream release changes.
2. Cross-machine reproducibility outside the documented Node/npm baseline and lockfile discipline.
