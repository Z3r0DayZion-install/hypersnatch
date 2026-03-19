# Artifact Schema

This schema is frozen for Phase 4. UI and validators must use these contracts.

## 1. har_classified.json

Required top-level fields:
- target
- requests

Each request must support:
- url
- method
- status
- classification
- mime_type (nullable)
- source (optional)
- notes (optional)

Allowed classifications:
- manifest
- playlist
- segment
- init-segment
- key
- license
- telemetry
- other

## 2. player_profile.json

Required:
- player_name
- confidence
- signals

Optional:
- protocol_guess
- drm_detected
- mse_detected
- site_fingerprint

## 3. stream_candidates.json

Required:
- candidates

Each candidate:
- url
- protocol
- score
- explanation
- source_modules

Optional:
- tokenized
- drm_flag
- mse_related
- quality_hint
- status

## 4. report.md

Must contain:
- target summary
- player summary
- protocol summary
- notable request summary
- ranked stream summary
- recommendation

## 5. .manifest.json

Must contain:
- artifacts
- hashes
- generated_at

Each artifact entry:
- filename
- sha256
