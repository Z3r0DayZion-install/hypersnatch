# HyperSnatch Runtime Test Plan

## 1. Manual Verification
- **Shortcuts**: `Ctrl+L` (Focus), `Ctrl+Enter` (Resurrect), `Esc` (Close Drawer).
- **Drawer**: Click 'Inspect' -> verify slide-in -> click backdrop -> verify close.
- **Persistence**: Enter artifacts -> Refresh -> verify data remains.
- **Scaling**: Paste 500+ URLs -> verify smooth scrolling and functional filters.
- **Electron**: Verify window dragging on header; verify buttons are non-draggable.

## 2. Automated Verification
- **Self-Test**: Click "RUN SELF-TEST" in the ACTIONS card.
- **Golden Pass**: Run `node verify_golden.js` to confirm engine logic integrity.
- **Sanitization**: Verify no `innerHTML` usage on artifact-derived strings.
