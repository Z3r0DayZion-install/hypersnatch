/**
 * HyperSnatch Phase 6: Bitrate Learner
 * Analyzes segment sizes and download times to identify bitrate patterns.
 */

class BitrateLearner {
    analyze(networkHar) {
        const patterns = {
            analyzed: Date.now(),
            tiers: [],
            switches: [],
            averageBitrate: 0
        };

        const entries = networkHar.log.entries.filter(e =>
            e.request.url.includes('.ts') || e.request.url.includes('.m4s')
        );

        entries.forEach(entry => {
            const size = entry.response.content.size;
            const time = entry.time; // ms
            const bitrate = (size * 8) / (time / 1000); // bps

            patterns.tiers.push({
                url: entry.request.url,
                size,
                time,
                bitrate
            });
        });

        if (patterns.tiers.length > 0) {
            patterns.averageBitrate = patterns.tiers.reduce((acc, t) => acc + t.bitrate, 0) / patterns.tiers.length;
        }

        return patterns;
    }
}

module.exports = new BitrateLearner();
