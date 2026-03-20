# Dependency Warning Inventory v1.5.5

Date: 2026-03-20  
Branch baseline: `main` (`v1.5.5` shipped)  
Active hardening branch: `release-readiness/v1.5.6-hardening`

## Evidence Capture

- Command: `npm install`
- Result: completed successfully
- Install warnings observed:
  - `whatwg-encoding@3.1.1` deprecation warning
  - `tar@6.2.1` deprecation warning
  - `glob@10.5.0` deprecation warning

## Runtime Baseline

- Expected Node runtime baseline from `package.json`: `20.17.0` minimum on Node 20 line
- Runtime used for this inventory: `20.17.0`
- Lockfile present: `package-lock.json` (yes)

## Classification Matrix

| Warning Surface | Status | Classification | Action |
|---|---|---|---|
| Install-time deprecations (`whatwg-encoding`, `tar`, `glob`) | Observed | Medium risk | Track transitive updates; no release gate failure currently |
| Missing builder/runtime dependency risk in clean worktrees | Controlled by setup and verify preflight | Medium risk | Enforced via `npm install` + `npm run verify` preconditions |
| Node/runtime drift from maintenance baseline | Not observed in this run | Medium risk | Keep engine-locked proof runs at `20.17.0` |

## Operational Rule

- If future `npm install` emits warnings, append them to this file with:
  - package name
  - warning text
  - classification (`informational`, `medium risk`, `action required`)
  - explicit disposition (`observation-only` or `maintenance action`)
