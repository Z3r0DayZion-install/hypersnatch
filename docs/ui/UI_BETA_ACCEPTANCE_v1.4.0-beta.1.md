# UI Beta Acceptance v1.4.0-beta.1

Date: 2026-03-19
Branch: `release-readiness/v1.4.0-beta.1`

## Scope

This pass validates operator-facing UI behavior for beta readiness with deterministic checks and targeted fixes only.

## Acceptance Checklist

- [x] Full-height shell behavior across desktop viewport sizes.
- [x] Visual consistency across shell, intake, trust panel, and result areas.
- [x] Empty states remain intentional and non-broken.
- [x] Error states are explicit and operator-readable.
- [x] Decode progress state communicates active processing.
- [x] Export success and failure messaging is explicit.
- [x] Keyboard navigation and visible focus states are present.
- [x] Responsive behavior remains intact for narrower widths.
- [x] Spacing, hierarchy, and panel contrast remain coherent.

## Reviewed Surfaces

- Main workstation shell layout (`.workstation-layout`, tab workspace, right trust panel).
- Intake/decode controls and status stream (`input`, mode, decode, status, radar indicator).
- Summary/candidates/timeline/report tabs and tab navigation model.
- Cases/export flow (`btnExportCase`, `btnExportNotes`).
- Core status and trust widgets (`auditSeal`, `bridgeText`, `uiVer`, proof panel rows).

## Fixes Applied

1. Version fallback identity in UI now resolves to `1.4.0-beta.1` instead of stale fallback strings.
2. Tab system upgraded with deterministic tab semantics:
   - `role="tablist"` + `role="tab"` + `role="tabpanel"`
   - `aria-selected` + `tabindex` state updates
   - keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`)
3. Decode action now exposes explicit progress state:
   - decode button disables while processing
   - label switches to `Decoding...`
   - button resets in `finally`
4. Export messaging improved:
   - notes export failures now report explicit error status
   - case export failures now include error reason
5. Typography usage aligned with loaded families (`Sora`, `IBM Plex Mono`) for coherent shell identity.
6. `verify:ui` smoke gate strengthened to enforce:
   - tab/tabpanel wiring
   - viewport-fill shell hook
   - focus-visible CSS coverage
   - critical decode/export control presence

## Intentional Deferrals

- None for beta acceptance scope.
