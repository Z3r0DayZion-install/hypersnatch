/**
 * HyperSnatch Replay: Segment Simulator
 * Emulates the fetch behavior of a media player.
 */

class SegmentSimulator {
    simulate(manifest) {
        const events = [];
        let currentTime = 0;

        manifest.segments.forEach((segment, index) => {
            events.push({
                time: currentTime,
                action: "fetch",
                uri: segment.uri,
                expectedBytes: segment.byteLength
            });
            currentTime += segment.duration * 1000; // ms
        });

        return {
            totalSimulationTime: currentTime,
            fetchEvents: events
        };
    }
}

module.exports = new SegmentSimulator();
