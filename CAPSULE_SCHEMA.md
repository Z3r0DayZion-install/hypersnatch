# HyperSnatch Capsule Schema Definition

The `.hsn` capsule format is a ZIP archive containing structured investigation artifacts necessary for deterministic, stateless replay of an investigation state.

## Required Fields

Every `.hsn` capsule must contain the following core files:

- `manifest.json`: Configuration and metadata index.
- `events.jsonl`: The immutable timeline of observations.
- `entities.json`: Cached known entities and properties (optional depending on export mode).
- `notebook.json`: Active scratchpad data for the analyst.

## Evidence Ledger Format (`events.jsonl`)

The evidence ledger strictly uses JSON Lines format. Each line must be a valid JSON object representing an event.

```json
{
  "event_id": "evt_uuid",
  "type": "dns_query|download|c2_beacon|file_create|...",
  "entity": "Primary entity or source node ID",
  "related_entity": "Target node ID (can be null for unary events)",
  "timestamp": "ISO-8601 string",
  "confidence": "Float 0.0-1.0",
  "data_source": "sysmon|pcap|analyst_manual|...",
  "metadata": "Arbitrary key-value context"
}
```

## Entity Graph Format

When the ledger is processed via `MaterializedGraphView`, graph edges are extracted deterministically based on `entity` and `related_entity` strings matching `type` constraints.

## Timeline Structure

The `TimelineEngine` projects events functionally. Time slices can be queried by `timestamp` limits, ensuring that temporal ordering guarantees the same view result regardless of environment.
