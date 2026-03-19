# UI Polish Before/After Notes v1.4.0

Date: March 19, 2026

## Before

- JS expected critical controls (`input`, `btnDecode`, `status`, `cmd`, proof IDs) that were absent from HTML.
- Intake and decode control flow was fragmented and hard to scan.
- Right rail emphasized raw metadata but not proof/trust cues.
- Visual system had inconsistent spacing and mixed style conventions.
- Responsive behavior degraded across narrower layouts.

## After

- Added a full intake and decode shell with complete runtime IDs and clear action flow.
- Added summary strip, command/export controls, refusal section, audit seal, script trace, and timeline snapshot blocks.
- Added trust-focused right panel with explicit protocol/best candidate/switch/ladder/proof context.
- Added tactical console container for event telemetry.
- Applied a coherent visual layer: tokenized surfaces, consistent borders/radii/shadows, refined tabs, and focus-visible states.
- Added responsive layout behavior for medium/small viewports.
- Fixed decode bug in `onDecode` (`inputTarget` -> `input`) and improved status class handling.

## Screenshot Instructions

Use Electron app runtime to capture polished surfaces:

1. Launch app:

```powershell
npm run dev
```

2. Capture these views:
- Intake and Decode shell (`Summary` tab, top section)
- Candidates table with best candidate highlighted
- Trust and Proof right panel
- Timeline tab with reconstructed events
- Export controls in cases/report flow

3. Optional static file preview:

```powershell
npm run ui:open
```
