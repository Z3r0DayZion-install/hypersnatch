"use strict";

/**
 * Extracts streams and manifests from Flowplayer
 */
class FlowplayerExtractor {
    static identify(windowObj) {
        return !!windowObj.flowplayer;
    }

    static extract(windowObj) {
        console.log(`[FlowplayerExtractor] Found Flowplayer on page`);
        const streams = [];

        // Flowplayer attached to instances
        if (windowObj.flowplayer.instances) {
            for (const instance of windowObj.flowplayer.instances) {
                if (instance.video && instance.video.src) {
                    streams.push({
                        url: instance.video.src,
                        type: instance.video.type || 'unknown'
                    });
                }
                // Sometimes sources are stored in an array
                if (instance.video && instance.video.sources) {
                    for (const src of instance.video.sources) {
                        streams.push({
                            url: src.src,
                            type: src.type || 'unknown'
                        });
                    }
                }
            }
        }

        return {
            player: 'flowplayer',
            streams,
            rawConfig: {}
        };
    }
}

module.exports = FlowplayerExtractor;
