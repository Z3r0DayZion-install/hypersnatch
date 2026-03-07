/**
 * HyperSnatch Replay: Manifest Rebuilder
 * Reconstructs streaming manifests from network HAR data.
 */

class ManifestRebuilder {
    rebuild(networkHar) {
        const manifest = {
            type: "HLS",
            version: "3",
            segments: [],
            targetDuration: 0
        };

        const entries = networkHar.log.entries.filter(e =>
            e.request.url.includes('.ts') || e.request.url.includes('.m4s')
        );

        entries.forEach((entry, index) => {
            manifest.segments.push({
                uri: entry.request.url,
                duration: 2.0, // Heuristic: typical segment duration
                byteLength: entry.response.content.size
            });
        });

        manifest.targetDuration = 2.0;
        return manifest;
    }
}

module.exports = new ManifestRebuilder();
