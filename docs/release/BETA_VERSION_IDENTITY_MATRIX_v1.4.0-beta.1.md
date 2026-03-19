# Beta Version Identity Matrix v1.4.0-beta.1

Date: 2026-03-19
Branch: `release-readiness/v1.4.0-beta.1`

## Active Version-Bearing Surfaces

| Surface | Old Value | New Value | Status |
|---|---|---|---|
| `package.json` | `1.3.1` | `1.4.0-beta.1` | Updated |
| `package-lock.json` root/version | `1.3.1` | `1.4.0-beta.1` | Updated |
| `VERSION.json` version | `1.3.1` | `1.4.0-beta.1` | Updated |
| `VERSION.json` codename | `Sovereign` | `Vanguard Beta` | Updated |
| `README.md` headline/status | `v1.3.1-sovereign` archived | `v1.4.0-beta.1` beta-readiness | Updated |
| `docs/PROJECT_STATUS.md` current line | `1.3.1 Sovereign` | `1.4.0-beta.1` prerelease target | Updated |
| `docs/agent/MASTER_OVERVIEW.md` project line | `v1.3.1-sovereign` | `v1.4.0-beta.1` + frozen stable baseline note | Updated |
| `ui/hypersnatch-ui.html` fallback version labels | `1.0.0`, `v1.2.0-web` | `1.4.0-beta.1` fallback | Updated |
| `src/bridge/ui-bridge.js` runtime version fallback | `1.0.0` | `0.0.0-dev` with `VERSION.json` primary source | Updated |
| `scripts/build_release_pack.js` fallback version | `1.3.1` | `0.0.0-dev` | Updated |
| `package.json` `release:pack` output behavior | static `HyperSnatch_release.zip` flow | version-aware wrapper (`build_release_pack.js`) | Updated |
| `tests/final_sovereign_audit.js` legacy release path expectation | `release/HyperSnatch_v1.3.1` | dynamic `release/HyperSnatch_v${package.version}` | Updated |

## Beta Artifact Identity

| Surface | Old Value | New Value | Status |
|---|---|---|---|
| Wrapper artifact naming (`build:wrapper`) | `HyperSnatch_Vanguard_v1.3.1.zip` (via old package version) | `HyperSnatch_Vanguard_v1.4.0-beta.1.zip` | Updated via package version alignment |
| Wrapper installer expectation | `HyperSnatch-Setup-1.3.1.exe` | `HyperSnatch-Setup-1.4.0-beta.1.exe` | Updated via package version alignment |

## Intentional Legacy Retentions (Not Mutated)

These remain unchanged to preserve historical proof chains:

- `docs/release/RELEASE_PROOF_v1.3.1.md`
- `docs/security/RELEASE_CHECKLIST.md` (stable-line checklist)
- `docs/RELEASE_DAY_CHECKLIST.md` (stable-line procedure text)
- `docs/release/POST_RELEASE_REPO_HYGIENE.md`

Rationale: they document immutable `v1.3.1` release evidence and should not be rewritten as beta artifacts.
