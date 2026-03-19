# Phase 4 Test Matrix

## Unit
- validateBundle detects missing fields
- verifyManifestHashes detects mismatch
- parsedBundleStore normalizes state

## Integration
- load target_2_hls bundle and render summary
- load target_4_dash bundle and render candidates
- load target_6_videojs bundle and render player profile

## Smoke
- click Load Evidence
- click Validate Bundle
- switch tabs: Summary, Candidates, HAR, Player, Report
- Verify integrity panel status updates
