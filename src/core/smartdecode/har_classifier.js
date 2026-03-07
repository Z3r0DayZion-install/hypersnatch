/**
 * HAR Traffic Classifier
 * Analyzes network.har JSON logs and categorizes traffic into video intelligence boundaries.
 */

class HarClassifier {
    constructor() {
        this.patterns = {
            manifests: [/\.m3u8/i, /\.mpd/i],
            segments: [/\.ts/i, /\.m4s/i, /\/segment/i, /\/frag/i, /\/seq/i],
            keys: [/\.key/i, /\/license/i, /drm/i, /widevine/i, /playready/i, /fairplay/i],
            telemetry: [/metric/i, /beacon/i, /telemetry/i, /log/i, /stats/i, /track/i]
        };
    }

    /**
     * Parse a HAR JSON log and categorize its entries structurally.
     * @param {Object} harJson The parsed HAR log object.
     * @returns {Object} Categorized arrays of entries and derived flags.
     */
    analyze(harJson) {
        const analysis = {
            manifests: [],
            segments: [],
            keys: [],
            telemetry: [],
            other: [],
            flags: {
                drmDetected: false,
                accessTokenRejected: false,
                mseStreamDetected: false
            }
        };

        if (!harJson || !harJson.log || !harJson.log.entries) {
            return analysis; // Return empty structure for invalid HAR
        }

        const entries = harJson.log.entries;

        entries.forEach(entry => {
            const url = entry.request.url || "";
            const status = entry.response ? entry.response.status : 0;
            const mime = (entry.response && entry.response.content && entry.response.content.mimeType) ? entry.response.content.mimeType : "";

            let categorized = false;

            // 1. Check Token rejections
            if (status === 401 || status === 403) {
                if (url.includes('token') || url.includes('auth') || url.includes('sig')) {
                    analysis.flags.accessTokenRejected = true;
                }
            }

            // 2. Check DRM / Key requests
            if (this.patterns.keys.some(p => p.test(url) || p.test(mime))) {
                analysis.keys.push({ url, status, mime });
                analysis.flags.drmDetected = true;
                categorized = true;
            }

            // 3. Check Manifests
            if (!categorized && this.patterns.manifests.some(p => p.test(url) || p.test(mime))) {
                analysis.manifests.push({ url, status, mime });
                categorized = true;
            }

            // 4. Check Segments
            if (!categorized && this.patterns.segments.some(p => p.test(url) || p.test(mime))) {
                analysis.segments.push({ url, status, mime });
                analysis.flags.mseStreamDetected = true;
                categorized = true;
            }

            // 5. Check Telemetry
            if (!categorized && this.patterns.telemetry.some(p => p.test(url))) {
                analysis.telemetry.push({ url, status, mime });
                categorized = true;
            }

            // 6. Other Video/Audio
            if (!categorized && (url.includes('.mp4') || mime.includes('video/') || mime.includes('audio/'))) {
                analysis.other.push({ url, status, mime, category: 'media' });
                categorized = true;
            }
        });

        return analysis;
    }
}

module.exports = { HarClassifier };
