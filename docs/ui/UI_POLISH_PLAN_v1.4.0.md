# UI Polish Plan v1.4.0

Date: March 19, 2026
Branch: `feat/ui-polish-v1.4.0`

## Objectives

1. Make the operator shell look intentional and premium.
2. Improve intake clarity and first-run decode flow.
3. Make best-candidate and trust/proof signals instantly scannable.
4. Preserve existing JS runtime behaviors and IDs used by bridge logic.
5. Improve responsiveness and keyboard/a11y affordances.

## Surface Changes

## 1) Visual shell

- Refined typography and dark palette with a single accent system.
- Upgraded panel/border/shadow language for clearer hierarchy.
- Better tab affordances and status chips.

## 2) Intake workflow

- Added a dedicated intake/decode shell:
  - file import
  - mode selector
  - payload input
  - decode/clear/pick controls
  - real-time status line
- Added decode summary counters (candidate count, best host, refusals).

## 3) SmartDecode result support

- Added explicit command/export action bar.
- Added refusal rendering block and audit seal area.
- Added script trace and timeline snapshot stubs for deterministic status messaging.

## 4) Trust/proof panel

- Right rail now surfaces trust-oriented fields:
  - protocol
  - best candidate
  - stream ladder
  - switch state
  - DRM/MSE indicators
  - hash visibility
- Added tactical event console container (`forensicCard`) for licensed tiers.

## 5) Accessibility + responsive

- Added focus-visible outlines for keyboard navigation.
- Added breakpoints for tablet/smaller widths.
- Preserved readable sizing and spacing under reduced viewport widths.

## Implementation Note

The existing UI script depended on IDs missing in markup. This pass restores those IDs directly in UI so runtime bindings work without null-element failures.
