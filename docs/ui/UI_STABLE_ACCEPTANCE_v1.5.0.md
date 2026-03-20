# UI Stable Acceptance v1.5.0

Date: 2026-03-19
Target: `v1.5.0`

## Stable Bar

Stable acceptance requires beta behavior to remain intact plus stable-level confidence in truthfulness and usability under normal operator flow.

## Must-Pass Areas

1. Workflow truthfulness
- no false success messaging
- warning/failed/canceled/manual-review remain explicit in queue, case, and reports

2. Case and trust clarity
- case rollups and trust summaries are readable at a glance
- manual-review and failure reasons are visible without hidden panels

3. Reporting and lineage depth
- deterministic report structure remains unchanged
- timeline/lineage sections contain meaningful state-driven content
- report and export metadata stay truthful

4. Interaction quality
- keyboard navigation and focus visibility remain intact
- responsive layout does not collapse core case/queue/report surfaces
- overflow states remain readable and do not hide errors

5. Export integrity
- case and batch report export flows remain functional
- export naming and content align with active version identity

## Stable Verification Commands

```bash
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
npm run audit:final
```

## Stable Rejection Conditions

Do not tag stable if any of the following are true:

- queue-to-case-to-report flow is inconsistent
- lineage/timeline surfaces are missing or stale
- report/export content mismatches UI state
- verify/build/audit gates are flaky or red
- version/artifact identity is inconsistent
