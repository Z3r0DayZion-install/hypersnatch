 HyperSnatch Release Proof v1.6.6

Date: 2026-06-21
Release line: stable

## Locked Release Record

- Stable release: `v1.6.6`
- Commit SHA: `9bca2eb1`
- Tag: `v1.6.6` (annotated)
- Installer: `HyperSnatch-Setup-1.6.6.exe`
- Installer SHA256: `a6b357902cc18cc7c4292b7e948ea342840c0e1da5c1324d803e14d7505a300f`
- Zip artifact: `HyperSnatch_Vanguard_v1.6.6.zip`
- Zip SHA256: `8224955cf9fb19eb54c3f7226a93bd7daf16faea4d0c86a07c921ff0854e0420`
- app.asar SHA256: `2a55e98c4d5d912aac8be569f689e476fa3e2ff2ec2b077200dfdc78a20f9da5`
- Release URL: `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.6`

## Gate Sequence and Result

1. `npm run preflight` — PASS (stale 1.6.5 artifacts cleaned before gate)
2. `npx playwright test` — PASS (93/93 E2E tests)
3. `npm run audit:stable` — PASS
4. `npm run release:gate` — PASS (all steps)

## Identity Truth

- `package.json` version = `1.6.6`
- `VERSION.json` version = `1.6.6`, codename = `Insane Mode`
- `APP_VERSION_FALLBACK` in `hypersnatch-ui.html` = `1.6.6`
- UI badge `#uiVer` = `v1.6.6`
- Built artifact names contain `1.6.6`
- `git status --short` = clean

## What v1.6.6 Changed

### UI Wiring
- `caseUpdateFinding`: `#findingUpdateInput` + `#btnCaseUpdateFinding` + async handler + Enter key binding + `withLoading`

### Bug Fixes
- `policyAuditLog`: replaced `log?.entries || log` with `Array.isArray(log) ? log : (log?.entries || [])` — prevents `Array.prototype.entries` method being evaluated as truthy, which caused empty render

### UI Polish
- `renderList` empty-state: upgraded from `<div class="muted tiny">No data.</div>` to `<div class="empty-state">No data</div>`

### E2E Tests (+20, tests 71–90)
- `caseUpdateFinding` happy path, empty guard, Enter key (71–73)
- `wsNameInput` Enter key, `wsCreate` happy path (74–75)
- `deployProfileInput` Enter key, `deployActivate` stat (76–77)
- `policyAudit` ALLOW/DENY log rendering (78)
- `statExchanges` counter after trust audit (79)
- `statPolicyDecisions` counter after policy load (80)
- `renderList` empty-state `.empty-state` class proof (81)
- UI version badge semver format check (82)
- `statTopNode` after graph hot nodes (83)
- `statBridgeCount` after graph bridges (84)
- `caseUpdateFinding` no-active-case guard (85)
- Deploy list profile rendering (86)
- `statActiveProfile` after deploy list (87)
- `wsCreate` empty name guard (88)
- `deployActivate` empty profile guard (89)
- Anomaly scoring `statAnomalyHigh`/`statAnomalyAvg` counters (90)

## Publish Checklist

* [x] `release:gate` PASS
* [x] 93/93 E2E tests green
* [x] Annotated tag `v1.6.6` on `9bca2eb1`
* [x] MANIFEST.json with SHA256 hashes generated
* [x] `git push origin main`
* [x] `git push origin v1.6.6`
* [x] GitHub Release created with installer + zip attached
* [x] Post-download SHA256 hash verified against MANIFEST.json

