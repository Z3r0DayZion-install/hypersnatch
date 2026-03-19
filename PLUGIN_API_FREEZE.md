# Sovereign Plugin API Interface Freeze

To ensure backward compatibility and strict security sandboxing, all future HyperSnatch plugins must adhere to this finalized interface schema.

## Core Plugin Definition

Every plugin must expose the following metadata structure:

```json
{
  "plugin_name": "Unique semantic name without spaces",
  "version": "Semantic versioning (1.0.0)",
  "author": "String",
  "capabilities": ["parse_pcap", "enrich_ip", "correlate", "render_ui"]
}
```

## Input/Output Interface

The `execute()` method in any plugin MUST match this signature:

```javascript
/**
 * @param {Object} inputs - Pre-validated parameters required by the plugin.
 * @param {Object} context - Read-only exposure of the current EventStore or GraphQL state.
 * @returns {Array} - An array of Events adhering to the Evidence Ledger Format.
 */
async function execute(inputs, context) {
    // Execution constraints:
    // 1. Plugins cannot read/write direct filesystem outside their sandbox
    // 2. Network outbound is blocked by default unless `capabilities: ["network"]` is set.
    // ...
}
```

## Execution Constraints

- Plugins cannot mutate existing `EventStore` timelines.
- Outputs must be generated dynamically and appended functionally via the engine.
- Asynchronous constraints apply; plugins running over 3000ms will be terminated asynchronously.
