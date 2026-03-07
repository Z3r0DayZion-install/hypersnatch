# Confidence Scoring Model (0–100)

Purpose: produce a consistent, explainable confidence score for each stream candidate.

## Scoring signals

### High confidence
- (+40) Explicit manifest detected (.m3u8/.mpd) in network.har
- (+25) Candidate appears in player_config.json under `sources` / `playlist` / `manifest`
- (+15) Segment pattern confirmed in HAR (ts/m4s/init segments)
- (+10) Player fingerprint confidence >= 0.85 and known extraction path matches

### Medium confidence
- (+15) Candidate discovered via JS trace (fetch/XHR) and matches known protocol regex
- (+10) Host/CDN pattern consistent with known media delivery endpoints

### Low confidence / penalties
- (-30) Candidate is blob: URL without MSE capture artifacts
- (-25) Candidate contains expiring token and request already 403/401 in HAR
- (-50) DRM/EME detected (expected outcome: forensic report only)

## Score bands
- 90–100: extraction very likely
- 70–89 : likely, but may require token refresh or correct variant selection
- 40–69 : partial evidence; manual inspect recommended
- 0–39  : weak candidate; likely blocked or false positive
