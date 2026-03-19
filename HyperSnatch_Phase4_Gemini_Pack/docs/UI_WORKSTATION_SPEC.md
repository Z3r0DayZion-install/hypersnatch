# UI Workstation Spec

## Main layout

Top bar:
- Load Evidence
- Validate Bundle
- Export Summary
- Verify Integrity
- Settings

Left rail:
- Sessions
- Evidence files
- Saved bundles
- Validation status

Center workspace tabs:
- Summary
- Candidates
- HAR
- Player
- Report

Right intelligence panel:
- player fingerprint
- protocol
- DRM status
- MSE status
- candidate count
- top score
- manifest integrity

Bottom log dock:
- load events
- validation messages
- parser warnings
- export status

## Required screens

### Summary
Show:
- target name
- player detected
- protocol guess
- candidate count
- top candidate
- bundle validity badge

### Candidates
Table columns:
- rank
- score
- protocol
- url
- tokenized
- MSE
- DRM
- source modules

### HAR
Table columns:
- method
- status
- classification
- url
- mime
- notes

### Player
Show:
- player_name
- confidence
- signals list
- mse_detected
- drm_detected

### Report
Render report.md as readable markdown.

## Behavior

- If one artifact is missing, show warning but continue loading others.
- If schema is invalid, display exact validation errors.
- URLs must be copyable.
- Tables must be sortable.
