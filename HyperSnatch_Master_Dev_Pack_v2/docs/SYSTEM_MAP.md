# SYSTEM MAP (HyperSnatch)

This file defines the *canonical* module boundaries and contracts.

## Core Modules

### 1) Runtime Loader
**Input:** target URL, launch options  
**Output:** controlled runtime session handle + injected hooks ready before player init

### 2) DOM Scanner (SMARTDECODE:DOM)
**Input:** DOM snapshot + live DOM access  
**Output:** player containers, video tags, inline configs, script bundle list

### 3) Player Fingerprinting
**Input:** DOM signals + window objects + script signatures  
**Output:** player_profile.json (player name, confidence, supporting signals)

### 4) JS Trace (SMARTDECODE:TRACE)
**Input:** instrumented runtime  
**Output:** runtime_trace.json (fetch/XHR calls, variable finds, blob creation, init chain)

### 5) Network Capture
**Input:** runtime network events  
**Output:** network.har + classified request list (playlist, segments, keys, telemetry, license)

### 6) Memory Scanner
**Input:** window/global object scan + player state scan  
**Output:** candidate URLs + candidate stream objects + config dumps

### 7) MediaSource Capture (MSE)
**Input:** MediaSource/SourceBuffer hooks  
**Output:** mse_events.json + captured segment buffers (optional) + blob_map.json

### 8) Stream Detector
**Input:** DOM + trace + HAR + memory results  
**Output:** stream_candidates.json (ranked)

### 9) Playlist Parser
**Input:** stream candidate URL(s)  
**Output:** parsed playlist tree (HLS master/media, DASH MPD) + representation ladder

### 10) Segment Reconstruction
**Input:** parsed playlist / segment list  
**Output:** reconstructed output OR forensic segment bundle + reconstruction_report.md

### 11) Evidence Export
**Input:** all artifacts  
**Output:** evidence bundle (DOM snapshot, HAR, configs, traces, report.md, integrity hashes)

### 12) AI Analyzer (Optional / Tiered)
**Input:** evidence bundle  
**Output:** generated rules/plugins + explanation + confidence

## GUI Modules

- Session Sidebar (runs, pins, tags)
- Target Runner (start/stop/capture toggles)
- Network Log Panel (filter/search/classify)
- Trace Panel (fetch/xhr timeline + variable discovery)
- Stream Candidates Table (confidence sorting, copy URL)
- Playlist Tree + Segment Timeline
- Evidence Explorer (bundle viewer/export)

## Hard Rule
Every module must produce explicit artifacts. No silent magic. Every decision should be explainable in the report.
