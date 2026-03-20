# v1.5.1 Hardening Plan

Date: 2026-03-20
Branch: `release-readiness/v1.5.1-hardening`
Baseline: merged `main` after post-release audit PR #17

## Goal
Deliver a narrow hardening release that improves maintenance confidence without adding new feature scope.

## In-Scope
- audit coverage clarity
- dependency hygiene confidence
- UI proof-depth strengthening

## Out of Scope
- new feature families
- broad UI redesign
- random cleanup blobs
- v1.6.0 expansion work

## Workstreams

### 1. Audit Coverage Clarity
- make `audit:final` coverage policy explicit for hash and CLI checks
- remove ambiguous skip interpretation in release proof workflow
- document expected audit outcomes and failure criteria

### 2. Dependency Hygiene Confidence
- inventory and triage setup warnings that affect maintainer confidence
- define patch-safe dependency hygiene actions for maintenance line
- update reproducibility notes with actionable maintainer guidance

### 3. UI Proof-Depth Strengthening
- add deeper assertion coverage for state truth paths (warning/failure/manual-review)
- strengthen review criteria for queue/case/report state consistency
- keep UI work to verification depth, not redesign

## Required Gates
Run after each meaningful change:

```bash
npm install
npm test
npm run verify:ui
npm run build:wrapper
npm run verify
npm run audit:final
```

## Release Discipline
- merge commit only
- no squash
- clean merged-main proof required before any tag
- identity alignment only after hardening changes are final
