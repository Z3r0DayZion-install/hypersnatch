"use strict";

/**
 * Extracts stream URLs from Video.js
 */
class VideoJSExtractor {
    static identify(windowObj) {
        // Video.js often attaches to window.videojs or has elements with .video-js class
        return typeof windowObj.videojs === 'function' || Object.keys(windowObj.videojs?.players || {}).length > 0;
    }

    static extract(windowObj) {
        console.log(`[VideoJSExtractor] Found Video.js on page`);
        const players = windowObj.videojs?.players || {};
        const streams = [];

        for (const playerId in players) {
            const player = players[playerId];
            // Try getting the current source
            if (player && player.currentSource) {
                const src = player.currentSource();
                if (src && src.src) {
                    streams.push({
                        url: src.src,
                        type: src.type || 'unknown',
                        label: 'master'
                    });
                }
            }
        }

        return {
            player: 'videojs',
            streams,
            rawConfig: {}
        };
    }
}

module.exports = VideoJSExtractor;
