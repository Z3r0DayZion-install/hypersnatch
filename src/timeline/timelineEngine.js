/**
 * TimelineEngine.js (Phase 86)
 * Reconstructs case timelines automatically from captured evidence.
 * Supports chronological event ordering, temporal clustering, burst detection.
 */
class TimelineEngine {
    constructor() {
        this.timelines = new Map();
    }

    reconstruct(caseId, events) {
        if (!events || !Array.isArray(events)) return null;

        // 1. Sort chronologically
        const sorted = [...events].sort((a, b) => a.ts - b.ts);

        // 2. Initial state
        const timeline = {
            caseId,
            reconstructedAt: new Date().toISOString(),
            eventCount: sorted.length,
            timeSpanMs: sorted.length > 0 ? sorted[sorted.length - 1].ts - sorted[0].ts : 0,
            events: sorted,
            bursts: [],
            clusters: []
        };

        // 3. Cluster events (events within 5 mins of each other)
        const CLUSTER_THRESHOLD_MS = 5 * 60 * 1000;
        let currentCluster = [];

        for (const evt of sorted) {
            if (currentCluster.length === 0) {
                currentCluster.push(evt);
                continue;
            }

            const lastTs = currentCluster[currentCluster.length - 1].ts;
            if (evt.ts - lastTs <= CLUSTER_THRESHOLD_MS) {
                currentCluster.push(evt);
            } else {
                timeline.clusters.push(this._finalizeCluster(currentCluster));
                currentCluster = [evt];
            }
        }
        if (currentCluster.length > 0) timeline.clusters.push(this._finalizeCluster(currentCluster));

        // 4. Burst detection (rapid succession of > 5 events within 10 seconds)
        const BURST_THRESHOLD_MS = 10 * 1000;
        const BURST_MIN_EVENTS = 5;

        for (let i = 0; i < sorted.length; i++) {
            let j = i;
            while (j < sorted.length && sorted[j].ts - sorted[i].ts <= BURST_THRESHOLD_MS) {
                j++;
            }
            if (j - i >= BURST_MIN_EVENTS) {
                timeline.bursts.push({
                    startTs: sorted[i].ts,
                    endTs: sorted[j - 1].ts,
                    eventCount: j - i,
                    events: sorted.slice(i, j).map(e => e.id || e.type)
                });
                i = j - 1; // skip ahead to avoid overlapping bursts
            }
        }

        this.timelines.set(caseId, timeline);
        return timeline;
    }

    _finalizeCluster(events) {
        return {
            startTs: events[0].ts,
            endTs: events[events.length - 1].ts,
            durationMs: events[events.length - 1].ts - events[0].ts,
            eventCount: events.length,
            types: [...new Set(events.map(e => e.type))]
        };
    }

    getTimeline(caseId) {
        return this.timelines.get(caseId) || null;
    }

    getStats() {
        return {
            timelinesReconstructed: this.timelines.size,
            totalBurstsDetected: Array.from(this.timelines.values()).reduce((sum, tl) => sum + tl.bursts.length, 0)
        };
    }
}

module.exports = TimelineEngine;
