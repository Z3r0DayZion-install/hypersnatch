# Phase 4 Acceptance Gates

Phase 4 is complete only if all of these are true.

## Loader
- can load a real evidence folder from datasets/evidence_targets
- returns explicit file paths + parsed artifacts

## Validator
- catches missing required files
- catches bad JSON
- catches missing required fields
- catches manifest hash mismatch

## UI
- loads one real bundle end-to-end
- displays player profile
- displays candidates
- displays HAR classifications
- renders report.md
- surfaces warnings and errors visibly

## Tests
- all offline
- no skipped critical tests
- at least one full-bundle integration test

## Packaging
- preview release checklist exists
- one known-good sample bundle identified
