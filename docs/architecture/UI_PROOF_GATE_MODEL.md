# UI Proof Gate Model

## Purpose

`verify:ui` enforces a minimum functional contract for operator workflow integrity and prevents silent regressions in critical UI hooks.

## Gate Location

- Script: `scripts/ui_smoke_check.js`
- Primary surface: `ui/hypersnatch-ui.html`

## What the Gate Asserts

1. Shell and accessibility baseline
- tab roles and panel wiring
- focus-visible styles
- live status semantics

2. Core workflow controls
- decode and queue controls
- case/workspace bridge controls
- export controls

3. Truthfulness hooks
- decode outcome evaluation path
- deterministic audit seal path
- explicit export failure messaging

4. Queue observability hooks
- manual-review/failure/duration fields
- manual-review action control

5. Case workspace depth hooks
- case workspace panel IDs and actions
- open/reopen case-linked job controls

6. Reporting and lineage hooks
- required report section headings
- timeline generation helpers
- reason-chain rendering hooks
- report export variants (MD + JSON)

## Policy

- `verify:ui` failures block readiness claims.
- New meaningful UI slices must add proof assertions.
- Gate assertions should target workflow value, not cosmetic details.

## Expected Usage

Run in every meaningful slice gate chain:

1. `npm test`
2. `npm run verify:ui`
3. `npm run verify`
4. `npm run build:wrapper`
5. `npm run audit:final` when proof/release surfaces are touched
