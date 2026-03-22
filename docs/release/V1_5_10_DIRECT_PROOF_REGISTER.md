# v1.5.10 Direct Proof Register

Date: 2026-03-22  
Branch: `release-readiness/v1.5.10-hardening`

This register records release-critical claims by current proof type and the upgrade path for claims that remain indirect.

## Classification Rules

- `Direct (artifact)`: claim is proven by inspecting concrete artifacts generated for the target version.
- `Direct (command output)`: claim is proven by deterministic command output tokens in the required gate sequence.
- `Indirect`: claim is inferred from adjacent checks or harness-level coverage and is not yet direct packaged interaction evidence.

## Current Register

| Claim ID | Release-Critical Claim | Current Proof Type | Evidence Command/Artifact | Evidence Token | Class | Upgrade Path |
|---|---|---|---|---|---|---|
| DPR-01 | Version identity is aligned | Direct (artifact + command output) | `package.json`, `VERSION.json`, `dist/HyperSnatch_Vanguard_v1.5.9.zip` | `1.5.9` identity match across files/artifact names | Direct | Keep identity matrix checks in release flow |
| DPR-02 | Strict stable signoff is approved | Direct (command output) | `npm run audit:stable` | `SIGNOFF STATUS: APPROVED` | Direct | None required; keep strict gate mandatory |
| DPR-03 | `audit:final` is maintenance-only | Direct (command output) | `npm run audit:final` | `SIGNOFF STATUS: NON-SIGNOFF` | Direct | None required; keep language normalized |
| DPR-04 | Stable artifact/hash contract is met | Direct (artifact + command output) | `dist/SHA256SUMS.txt` + `npm run audit:stable` | `Hash verification: PASS` | Direct | None required; keep strict hash enforcement |
| DPR-05 | Mixed/stale dist artifacts are blocked | Direct (command output behavior) | `npm run verify` + `npm run audit:stable` | explicit fail conditions for stale/mixed versions | Direct | None required; preserve strict dist hygiene |
| DPR-06 | Packaged app includes required operator/runtime markers | Direct (artifact) | `dist/win-unpacked/resources/app.asar` via `npm run verify` | `Packaged UI runtime markers verified from app.asar` | Direct (marker-level) | Upgrade to packaged interaction assertions beyond markers |
| DPR-07 | Queue/report/reopen/export runtime semantics are asserted | Indirect (harness/runtime extraction) | `npm run verify:ui` (`scripts/ui_smoke_check.js`) | `[ui-smoke] PASS...` with runtime function assertions | Indirect | Add packaged interaction runner that executes flows in packaged app context |
| DPR-08 | Wrapper packaging emits required release surfaces | Direct (command output + artifact presence) | `npm run build:wrapper` + `dist` outputs | versioned zip + manifest/checksum generation messages | Direct | Add deterministic wrapper transcript capture file if needed |
| DPR-09 | Release gate order is reproducible | Direct (command output sequence) | required command order | full ordered PASS sequence | Direct | Keep strict order enforcement in release docs |
| DPR-10 | Dependency baseline is current and governed | Direct (documentation + command output) | slice-2 dependency packet + `npm install` evidence | no-drift baseline + risk register | Direct (current snapshot) | Continue per-line refresh; treat future drift as new evidence cycle |
| DPR-11 | Binary is externally trusted by OS trust chain | Indirect/conditional | signing contract + signing evidence | only valid when signed evidence exists | Indirect | Define and enforce explicit signing contract for stable releases |
| DPR-12 | Governance docs reflect shipped state | Direct (documentation) | top-level governance packet | v1.5.9 shipped truth + v1.5.10 lane alignment | Direct | Maintain per-slice governance sync |

## Slice 3 Result

1. Direct vs indirect boundaries are explicit and auditable.
2. Indirect claims now carry concrete upgrade paths instead of narrative assumptions.
