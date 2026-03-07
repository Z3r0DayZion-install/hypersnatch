# Phase 4 Master Plan

## Mission

Build the first real HyperSnatch analyst workstation.

Phase 3 already generates:
- har_classified.json
- player_profile.json
- stream_candidates.json
- report.md
- .manifest.json

Phase 4 must turn those into a usable workflow:

load evidence bundle
→ validate schema
→ render summary
→ inspect candidates
→ inspect HAR classifications
→ inspect report
→ export / verify bundle integrity

## Deliverables

1. Artifact schema freeze
2. Minimal evidence viewer UI
3. Bundle validator
4. Full-bundle acceptance tests
5. Preview release checklist

## Product posture

This is not a downloader UI.
This is a forensic analysis workstation.

The interface should behave like:
- Wireshark
- Burp Suite
- DevTools
- analyst console

## Core user loop

1. Select evidence folder
2. Validate bundle
3. Show top summary
4. Show ranked stream candidates
5. Show player fingerprint
6. Show HAR request classifications
7. Show markdown report
8. Export / verify integrity
