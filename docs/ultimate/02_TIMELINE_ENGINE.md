
# Timeline Reconstruction Engine

Goal:
Reconstruct propagation chains of narratives across sources.

Process:

1. Timestamp all events.
2. Cluster narratives.
3. Detect propagation chains.
4. Calculate influence scores.

Example event:

{
  "timestamp": "2026-03-04T08:01:22",
  "source": "channel_A",
  "narrative": "Topic_X"
}

Outputs:

- narrative timeline
- origin detection
- amplification chains
- coordination flags
