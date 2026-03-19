
# MediaSource Deep Reconstruction Engine

Goal:
Reconstruct video streams assembled in browser memory.

Pipeline:

Page Load
↓
Player Initializes
↓
Segments Loaded
↓
SourceBuffer.appendBuffer
↓
HyperSnatch captures segments
↓
Segments merged into video

Capabilities:
- Capture HLS segments
- Capture DASH fragments
- Reconstruct final MP4
