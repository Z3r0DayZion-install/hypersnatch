# v1.6.0 Expansion Charter

Date: 2026-06-21  
Branch: `feat/v1.6.0-expansion`  
Gate opened: after `v1.5.10` hardening slices 1–9 complete

## Intent

Expand the operator-visible surface of HyperSnatch to expose the large IPC backend
that exists in `src/main.js` (phases 60–80+) but is currently unreachable from the UI.
No new backend capability is required — the work is surfacing what is already built.

## Scope Guard

Allowed:
- UI surface expansion connecting existing IPC handlers to operator controls
- New UI tabs/panels wired to existing `electronAPI` bridge calls
- Test coverage for newly exposed flows
- Operator-facing documentation for new surfaces

Not allowed:
- New product direction unrelated to existing backend capability
- Architectural rewrites of `main.js` or `preload.js`
- Dependency upgrades outside safe patch-level fixes
- Any change to the `audit:stable` gate definition

## Reality Baseline (what exists in `src/main.js` but is UI-dark)

| Surface | IPC Channel(s) | Phase | UI Status |
|---|---|---|---|
| Intelligence graph | `intelligence-get-graph`, `intelligence-get-similar`, `intelligence-rebuild-graph` | 62 | Not exposed |
| Plugin ecosystem | `plugins-list`, `plugins-load`, `plugins-run-capability` | 63 | Not exposed |
| HyperQuery | `query-execute`, `query-stats` | 64 | Not exposed |
| Replay mutation | `replay-mutate-set`, `replay-mutate-clear` | 65 | Not exposed |
| Pattern discovery | `patterns-discover`, `patterns-cluster`, `patterns-anomalies`, `patterns-stats` | 66 | Not exposed |
| Topology mapper | `topology-map-case` | 67 | Not exposed |
| Insight generator | `insights-generate` | 68 | Not exposed |
| Case assistant | `assistant-briefing`, `assistant-suggest-related`, `assistant-propose-experiments` | 69 | Not exposed |
| Auto-investigator | `auto-investigate` | 70 | Not exposed |
| Pattern classifier | `ai-classify-bundles` | 71 | Not exposed |
| Anomaly scorer | `ai-score-anomalies` | 72 | Not exposed |
| Fingerprint library | `fplib-add`, `fplib-search`, `fplib-compare`, `fplib-export` | 73 | Not exposed |
| Cross-case miner | `cross-case-mine` | 74 | Not exposed |
| Research mode | `research-list-scripts`, `research-run-script`, `research-generate` | 75 | Not exposed |
| Workspace store | `ws-create`, `ws-list`, `ws-add-member`, `ws-assign-case`, `ws-activity-feed` | 76 | Not exposed |
| Trust registry | `trust-add-source`, `trust-verify`, `trust-log-exchange`, `trust-audit` | 77 | Not exposed |
| Graph centrality | `graph-centrality`, `graph-bridges`, `graph-rank-clusters`, `graph-hot-nodes` | 78 | Not exposed |
| Policy engine | `policy-load`, `policy-evaluate`, `policy-check`, `policy-audit` | 79 | Not exposed |
| Deployment profiles | `deploy-list`, `deploy-activate`, `deploy-compliance`, `deploy-quota` | 80 | Not exposed |

## Prioritized Workstreams

### P1 — Operator-critical (highest leverage, immediately useful)

1. **Intelligence Graph Panel** (phases 62, 78)
   - UI: new `Intelligence` tab showing node/edge graph with centrality scores
   - IPC: `intelligence-get-graph`, `intelligence-rebuild-graph`, `graph-centrality`, `graph-hot-nodes`
   - Value: connects decode results to cross-case entity correlation

2. **Case Assistant Panel** (phases 69, 70)
   - UI: sidebar widget on Case tab — auto-briefing, related suggestions, proposed experiments
   - IPC: `assistant-briefing`, `assistant-suggest-related`, `assistant-propose-experiments`, `auto-investigate`
   - Value: eliminates blank-page problem when opening a new case

3. **Pattern Discovery & Insights** (phases 66, 67, 68)
   - UI: new `Patterns` tab — cluster view, anomaly list, topology map, insights summary
   - IPC: `patterns-discover`, `patterns-cluster`, `patterns-anomalies`, `topology-map-case`, `insights-generate`
   - Value: surfaces cross-bundle patterns from the active case automatically

### P2 — High value, moderate complexity

4. **HyperQuery Console** (phase 64)
   - UI: query input box on Case tab or dedicated `Query` tab
   - IPC: `query-execute`, `query-stats`
   - Value: lets analysts run structured queries against the intelligence index

5. **Fingerprint Library** (phase 73, 74)
   - UI: `Library` tab — search/compare/export fingerprints, cross-case mining trigger
   - IPC: `fplib-*`, `cross-case-mine`
   - Value: operator-visible fingerprint knowledge base

6. **Plugin Ecosystem** (phase 63)
   - UI: `Plugins` tab — list installed plugins, load from path, run capabilities
   - IPC: `plugins-list`, `plugins-load`, `plugins-run-capability`
   - Value: opens extensibility to third-party/custom rules

### P3 — Supporting / administrative

7. **Workspace Panel** (phase 76)
   - UI: `Workspaces` tab — create, list, assign cases, activity feed
   - IPC: `ws-*`

8. **Policy & Deployment Panel** (phases 79, 80)
   - UI: `Settings` sub-panel — policy audit log, deployment profile selector, quota report
   - IPC: `policy-*`, `deploy-*`

9. **Research Mode** (phase 75)
   - UI: `Research` tab — script list, run script, review packet
   - IPC: `research-*`

## Delivery Approach

- One workstream per slice; each slice follows the same pattern:
  1. Wire `preload.js` bridge methods if not already present
  2. Add UI panel/tab to `ui/hypersnatch-ui.html`
  3. Add Playwright E2E test coverage for new flow
  4. Run `npm run release:gate` — must PASS
  5. Commit + update this charter with slice status

## Exit Criteria for v1.6.0 Release

- All P1 workstreams complete and E2E-tested
- P2/P3 complete or explicitly bounded-deferred with rationale
- `npm run release:gate` PASS on clean worktree
- `docs/PROJECT_STATUS.md` updated
- `v1.6.0` tagged from clean proof

## Slice Status

| Slice | Workstream | Status |
|---|---|---|
| v1.6.0-s1 | Intelligence Graph Panel | Pending |
| v1.6.0-s2 | Case Assistant Panel | Pending |
| v1.6.0-s3 | Pattern Discovery & Insights | Pending |
| v1.6.0-s4 | HyperQuery Console | Pending |
| v1.6.0-s5 | Fingerprint Library | Pending |
| v1.6.0-s6 | Plugin Ecosystem | Pending |
| v1.6.0-s7 | Workspace Panel | Pending |
| v1.6.0-s8 | Policy & Deployment Panel | Pending |
| v1.6.0-s9 | Research Mode | Pending |
