# Ultra Lab Buildout

## The 500-target goal
Do not treat this as 500 random URLs.
Treat it as a structured validation zoo.

## Target buckets
- 75 direct MP4 / HTML5
- 100 HLS playlists
- 75 DASH manifests
- 75 player framework pages
- 50 blob/MSE-heavy pages
- 50 tokenized / signed playlist flows
- 25 service worker proxied workflows
- 25 WASM-assisted players
- 25 public broadcaster / newsroom players

## Per-target artifact set
Each run should produce:
- metadata.json
- network.har
- dom_snapshot.html
- player_fingerprint.json
- runtime_trace.json
- mse_events.json
- extraction_result.json
- report.md
