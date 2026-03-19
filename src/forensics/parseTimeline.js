/**
 * Parses the Phase 3 `har_classified.json` outputs into a single chronological timeline.
 */
function parseTimeline(harObj) {
    let timeline = [];

    // Helper to map arrays
    const ingest = (arr, classification) => {
        if (!arr || !Array.isArray(arr)) return;
        arr.forEach(item => {
            timeline.push({
                url: item.url,
                mime: item.mime || 'unknown',
                classification: classification
            });
        });
    };

    // Phase 3 Schema structures HARs into strict category arrays, so we re-merge them
    ingest(harObj.manifests, 'manifest');
    ingest(harObj.segments, 'segment');
    ingest(harObj.keys, 'key');
    ingest(harObj.telemetry, 'telemetry');
    ingest(harObj.other, 'other');

    // Add index tracking
    return timeline.map((entry, index) => ({
        index: index,
        ...entry
    }));
}

module.exports = parseTimeline;
