# Stream Forensics Architecture

Inputs:
- har_classified.json
- stream_candidates.json

Processing modules:

HAR → Timeline Parser
HAR → Playlist Detector
Playlist → Segment Ladder Builder
Segments → Waterfall Analyzer
URLs → CDN Detection

Outputs:

timeline.json
ladder.json
waterfall.json
cdn_profile.json
token_patterns.json
