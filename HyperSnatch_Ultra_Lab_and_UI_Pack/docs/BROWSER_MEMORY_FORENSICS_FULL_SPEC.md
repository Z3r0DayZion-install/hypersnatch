# Browser Memory Forensics Full Spec

## Purpose
Capture video data when URLs are hidden and playback is assembled in memory.

## Main targets
- MediaSource
- SourceBuffer.appendBuffer
- blob URL creation
- object URLs
- player internal buffers

## Data to capture
- appendBuffer call order
- segment byte lengths
- init segment detection
- mime type
- timestamp sequence
- mapping to network requests when possible

## Output artifacts
- mse_events.json
- captured_segments/
- blob_map.json
- reconstruction_plan.md
