# Module Contracts

This file defines exactly what each key module must emit.

## Evidence Loader
Input:
- path to evidence target folder

Output:
```json
{
  "dom_snapshot_path": "...",
  "har_path": "...",
  "player_config_path": "...",
  "stream_trace_path": "..."
}
```

## HAR Parser
Output:
- normalized request list
- stable sorted order
- deterministic JSON

Artifact:
- `har_normalized.json`

## HAR Classifier
Input:
- normalized request list

Output:
- classified request list

Artifact:
- `har_classified.json`

Required labels:
- manifest
- playlist
- segment
- init-segment
- key
- license
- telemetry
- other

## Candidate Extractor
Output:
- candidate stream URLs
- source module attribution

Artifact:
- `stream_candidates_raw.json`

## Confidence Scorer
Output:
- ranked candidates
- numeric score
- explanation list

Artifact:
- `stream_candidates.json`

Required fields:
```json
{
  "url": "...",
  "protocol": "hls",
  "score": 92,
  "explanation": ["manifest in HAR", "player config match"],
  "source_modules": ["har", "config"]
}
```

## Player Fingerprinting
Artifact:
- `player_profile.json`

Required fields:
```json
{
  "player_name": "VideoJS",
  "confidence": 0.88,
  "signals": ["window.videojs", ".video-js", "video.min.js"]
}
```

## Evidence Report
Artifact:
- `report.md`

Must include:
- player summary
- protocol summary
- candidate ranking
- DRM/MSE/token status
- notable requests
- extraction recommendation

## Integrity Pack
Artifact:
- `integrity.json`

Must include SHA-256 for every output artifact.

## UI Contracts
The GUI must consume exactly:
- `player_profile.json`
- `stream_candidates.json`
- `har_classified.json`
- `report.md`
