# Acceptance Criteria

A module is not done until it satisfies all of the following.

## Universal criteria
- deterministic output
- offline tests
- explicit artifacts emitted
- no silent failure
- docs updated if schema changes

## HAR parser / classifier
Pass conditions:
- loads at least 2 real evidence HARs
- classifies manifests and segments correctly
- emits stable `har_classified.json`

## Candidate extractor
Pass conditions:
- extracts URLs from HAR, trace, and config
- dedupes stably
- emits deterministic output

## Confidence scoring
Pass conditions:
- follows `docs/CONFIDENCE_SCORING.md`
- emits explanations
- score bands behave as documented

## Player fingerprinting
Pass conditions:
- matches at least one framework from dataset
- emits confidence + evidence signals

## Evidence report
Pass conditions:
- readable markdown
- includes ranking + notable findings
- suitable for analyst review

## Minimal UI shell
Pass conditions:
- loads evidence bundle
- displays player profile
- displays classified requests
- displays ranked stream candidates
- no network dependency required
