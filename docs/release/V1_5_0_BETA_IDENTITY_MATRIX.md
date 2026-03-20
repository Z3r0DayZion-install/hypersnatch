# v1.5.0 Beta Identity Matrix

Date: 2026-03-19
Target tag: `v1.5.0-beta.1`

This matrix defines required version and artifact identity alignment before beta tagging.

## Version-Bearing Surfaces

| Surface | Current Baseline | Required Beta Value | Status |
|---|---|---|---|
| `package.json` version | `1.4.1` | `1.5.0-beta.1` | To Align |
| `package-lock.json` root version | `1.4.1` | `1.5.0-beta.1` | To Align |
| `VERSION.json` version | `1.4.1` | `1.5.0-beta.1` | To Align |
| UI fallback version in `ui/hypersnatch-ui.html` | `1.4.1` fallback | `1.5.0-beta.1` fallback | To Align |
| User-facing status docs (`docs/PROJECT_STATUS.md`) | stable v1.4.1 context | beta line called out | To Align |

## Artifact Identity Surfaces

| Surface | Current Baseline | Required Beta Value | Status |
|---|---|---|---|
| Wrapper artifact name | `HyperSnatch_Vanguard_v1.4.1.zip` | `HyperSnatch_Vanguard_v1.5.0-beta.1.zip` | To Align |
| Installer filename | `HyperSnatch-Setup-1.4.1.exe` | `HyperSnatch-Setup-1.5.0-beta.1.exe` | To Align |
| Release notes title/version | v1.4.1 line | v1.5.0-beta.1 prerelease | To Align |

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
