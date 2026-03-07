"use strict";

/**
 * Extracts streams and manifests from Shaka Player
 */
class ShakaExtractor {
    static identify(windowObj) {
        return !!windowObj.shaka;
    }

    static extract(windowObj) {
        console.log(`[ShakaExtractor] Found Shaka Player on page`);
        // Shaka Player doesn't expose a global active player array usually.
        // It's attached to the video element.
        // This requires DOM scanning for video elements with `player` attached

        const streams = [];
        const videoElements = windowObj.document.querySelectorAll('video');
        for (const video of videoElements) {
            // In many implementations, developers bind the player to the video element or a global
            if (video.ui && video.ui.getControls) {
                const controls = video.ui.getControls();
                if (controls && controls.getPlayer) {
                    const player = controls.getPlayer();
                    const manifestUri = player.getUri();

                    if (manifestUri) {
                        streams.push({
                            url: manifestUri,
                            type: manifestUri.includes('.mpd') ? 'dash' : 'hls'
                        });
                    }
                }
            }
        }

        return {
            player: 'shaka',
            streams,
            rawConfig: {}
        };
    }
}

module.exports = ShakaExtractor;
