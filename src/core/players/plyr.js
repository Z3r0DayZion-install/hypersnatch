"use strict";

/**
 * Extracts streams and manifests from Plyr
 */
class PlyrExtractor {
    static identify(windowObj) {
        return !!windowObj.Plyr;
    }

    static extract(windowObj) {
        console.log(`[PlyrExtractor] Found Plyr on page`);
        const streams = [];

        const elements = windowObj.document.querySelectorAll('.plyr video');
        for (const video of elements) {
            if (video.src) streams.push({ url: video.src, type: 'unknown' });
            const sources = video.querySelectorAll('source');
            for (const source of sources) {
                streams.push({ url: source.src, type: source.type || 'unknown' });
            }
        }

        return {
            player: 'plyr',
            streams,
            rawConfig: {}
        };
    }
}

module.exports = PlyrExtractor;
