# v1.5.0 Beta Identity Matrix

Date: 2026-03-19
Target tag: `v1.5.0-beta.1`

This matrix defines required version and artifact identity alignment before beta tagging.

## Version-Bearing Surfaces

| Surface | Current Baseline | Required Beta Value | Status |
|---|---|---|---|
| `package.json` version | `1.4.1` | `1.5.0-beta.1` | Updated |
| `package-lock.json` root version | `1.4.1` | `1.5.0-beta.1` | Updated |
| `VERSION.json` version | `1.4.1` | `1.5.0-beta.1` | Updated |
| UI fallback version in `ui/hypersnatch-ui.html` | `1.4.1` fallback | `1.5.0-beta.1` fallback | Updated |
| Bridge runtime version fallback in `src/bridge/ui-bridge.js` | `0.0.0-dev` fallback | package/version-aligned fallback chain | Updated |
| User-facing status docs (`docs/PROJECT_STATUS.md`) | stable v1.4.1 context | beta line called out | Updated |

## Artifact Identity Surfaces

| Surface | Current Baseline | Required Beta Value | Status |
|---|---|---|---|
| Wrapper artifact name | `HyperSnatch_Vanguard_v1.4.1.zip` | `HyperSnatch_Vanguard_v1.5.0-beta.1.zip` | Updated (via package version) |
| Installer filename | `HyperSnatch-Setup-1.4.1.exe` | `HyperSnatch-Setup-1.5.0-beta.1.exe` | Updated (via package version) |
| Release notes title/version | v1.4.1 line | v1.5.0-beta.1 prerelease | Pending release publication |

## Required Identity Checks

Run after alignment and before tag:

```bash
node -p "require('./package.json').version"
type VERSION.json
```

Expected exact output semantics:

- all version-bearing files and user-facing version surfaces resolve to `1.5.0-beta.1`
- generated artifact names include `v1.5.0-beta.1`

## Do Not Regress

- Do not alter immutable proof records for prior stable/prerelease lines.
- Do not claim beta identity if any surface remains on `1.4.1`.
