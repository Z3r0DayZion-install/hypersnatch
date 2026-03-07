# MODULE PROMPTS (for Gemini / Codex)

Use these as drop-in prompts when delegating work.

## Prompt: Player Fingerprinting Engine
You are implementing HyperSnatch's player fingerprinting engine.
Read:
- docs/PLAYER_FINGERPRINT_DATABASE.md
- schemas/player_fingerprint.example.json
Implement:
- load fingerprint definitions
- match against runtime signals (window objects, DOM selectors, script filenames)
Output:
- player_profile.json with confidence and evidence list
Add tests using datasets/evidence_targets where possible.

## Prompt: HAR Classifier
Implement a HAR request classifier that tags each request as:
- manifest
- playlist
- segment
- init-segment
- key
- license
- telemetry
- other
Use regex + mime + path hints.
Output:
- har_classified.json
Add tests.

## Prompt: Confidence Scoring
Implement docs/CONFIDENCE_SCORING.md scoring for stream_candidates.
Must output per-candidate score and explanation of contributing signals.

## Prompt: Evidence Export
Given an evidence folder, produce:
- report.md
- integrity.json with SHA-256 hashes
- standardized file names
Must be deterministic.
