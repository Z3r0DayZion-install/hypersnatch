# Stable Version Identity Matrix v1.4.0

Date: 2026-03-19
Branch: `release-readiness/v1.4.0-stable`

## Active Stable Surfaces

| Surface | Previous Value | Stable Value | Status |
|---|---|---|---|
| `package.json` version | `1.4.0-beta.1` | `1.4.0` | Updated |
| `package-lock.json` root version | `1.4.0-beta.1` | `1.4.0` | Updated |
| `VERSION.json` version | `1.4.0-beta.1` | `1.4.0` | Updated |
| `VERSION.json` codename | `Vanguard Beta` | `Vanguard Stable` | Updated |
| `README.md` headline/status | beta line | stable line | Updated |
| `docs/PROJECT_STATUS.md` | prerelease target wording | stable target wording | Updated |
| `docs/agent/MASTER_OVERVIEW.md` | beta prep wording | stable prep wording | Updated |
| `ui/hypersnatch-ui.html` fallback version | `1.4.0-beta.1` | `1.4.0` | Updated |
| `scripts/ui_smoke_check.js` version assertion | no stable fallback assertion | requires fallback `1.4.0` | Updated |

## Engine Policy Surface

| Surface | Previous Value | Stable Value | Status |
|---|---|---|---|
| `package.json` `devDependencies.jsdom` | `^27.0.1` | `26.1.0` | Updated (engine drift removed) |
| `package-lock.json` jsdom tree | jsdom 27 transitive chain | jsdom 26 transitive chain | Updated |
| `package.json` `engines.node` | `20.17.0` | `20.17.0` | Intentionally unchanged |

## Artifact Identity Expectation

With package version set to `1.4.0`, version-aware tooling now resolves to:

- installer: `HyperSnatch-Setup-1.4.0.exe`
- wrapper zip: `HyperSnatch_Vanguard_v1.4.0.zip`

## Intentional Historical Retentions

Beta and prior release records remain unchanged for traceability:

- `docs/release/BETA_*`
- `docs/release/RELEASE_PROOF_v1.3.1.md`
- `docs/ui/UI_BETA_ACCEPTANCE_v1.4.0-beta.1.md`
