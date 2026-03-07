# Player Fingerprint Database

## Purpose
Support universal extraction by recognizing frameworks rather than only websites.

## Core schema
Each fingerprint record should include:
- id
- player_name
- detection_signals
- window_objects
- dom_signatures
- script_signatures
- known_api_calls
- extraction_paths
- confidence_weight

## Example
player_name: VideoJS
window_objects:
- videojs
dom_signatures:
- .video-js
script_signatures:
- video.min.js
known_api_calls:
- videojs(...)
extraction_paths:
- player.currentSource()
- player.tech().vhs.playlists
