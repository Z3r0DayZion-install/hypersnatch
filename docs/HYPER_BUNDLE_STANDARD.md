# .hyper Evidence Bundle Standard

Bundle structure:

/evidence
 network.har
 dom_snapshot.html
 player_config.json
 stream_trace.json

/analysis
 timeline.json
 ladder.json
 waterfall.json
 cdn_profile.json
 token_patterns.json

/runtime
 mse_events.json
 blob_map.json
 runtime_player_state.json
 reconstruction_plan.json

/meta
 manifest.json
 tool_version.json
 bundle_hash.json

Design goals:
• deterministic
• portable
• air‑gap safe
