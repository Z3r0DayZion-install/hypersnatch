# UX Behavior Rules

## Workflow priority
1. paste target URL
2. start capture
3. immediately see player/protocol detection
4. inspect candidate streams
5. rebuild or export
6. inspect forensic artifacts

## Rules
- never hide raw technical data behind decorative UI
- default to analyst mode, not consumer mode
- every detection should have:
  - confidence
  - source module
  - timestamp
- every failure should be explicit:
  - no stream found
  - DRM detected
  - MSE only
  - token expired
