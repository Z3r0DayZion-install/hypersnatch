# Dependency Warning Inventory v1.5.9

Date: 2026-03-22  
Branch baseline: `main` (`v1.5.9` shipped)  
Active hardening branch: `release-readiness/v1.5.10-hardening`

## Evidence Capture

- Command: `npm install`
- Runs observed: 1 (clean worktree capture for slice 2)
- Result: completed successfully
- Install warnings observed: none

## Runtime Baseline

- Expected Node runtime baseline from `package.json`: `20.17.0` minimum on Node 20 line
- Runtime used for this inventory: `20.17.0`
- npm used for this inventory: `10.8.2`
- Lockfile present: `package-lock.json` (yes)

## Classification Matrix

| Warning Surface | Status | Classification | Action |
|---|---|---|---|
| Install-time warnings (`npm install`) | None observed | Informational | Observation-only |
| Missing builder/runtime dependency risk in clean worktrees | Controlled by setup + verify preconditions | Medium risk | Enforced via `npm install` + `npm run build:wrapper` + `npm run verify` |
| Node/runtime drift from maintenance baseline | Not observed in this run | Medium risk | Keep engine-locked proof runs at `20.17.0` |
| Range-based dependency drift risk (`^`) | Present in declaration posture | Medium risk | Govern through lockfile discipline and explicit dependency delta docs |

## Operational Rule

If future `npm install` emits warnings, append to latest inventory with:

1. package name
2. warning text
3. classification (`informational`, `medium risk`, `action required`)
4. explicit disposition (`observation-only` or `maintenance action`)
