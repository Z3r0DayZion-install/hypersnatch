# BUILD TASKS (Agent Tasklist)

## Priority 1: Lab + Intelligence
1) Implement Player Fingerprint DB loader + matcher (docs/PLAYER_FINGERPRINT_DATABASE.md)
2) Implement Stream Candidate Confidence Scorer (docs/CONFIDENCE_SCORING.md)
3) Implement HAR classifier: playlist/segment/key/telemetry/license
4) Implement Evidence Export Bundle with integrity hashes

## Priority 2: MSE / Memory Forensics
5) Implement MediaSource + SourceBuffer capture plumbing
6) Implement blob-map correlation: blob URL <-> appendBuffer events <-> network requests
7) Implement reconstruction plan generator

## Priority 3: AI Analyzer
8) Implement pattern extraction from evidence (use training scripts as reference)
9) Implement safe rule/plugin generation pipeline (review-gated)
10) Add regression tests using datasets/evidence_targets

## Priority 4: GUI
11) Session sidebar + target runner
12) Network log panel (filters/search + request classifier)
13) Stream candidates table + playlist tree + export panel

## Done criteria
- Each task ships with tests.
- Each task produces explicit artifacts (JSON/MD).
- No network calls in tests.
