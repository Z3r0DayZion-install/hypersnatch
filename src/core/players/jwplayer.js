"use strict";

/**
 * Extracts stream URLs and configurations directly from the JWPlayer API.
 */
class JWPlayerExtractor {
    static identify(windowObj) {
        return typeof windowObj.jwplayer === 'function' && windowObj.jwplayer().getConfig;
    }

    static extract(windowObj) {
        console.log(`[JWPlayerExtractor] Found JWPlayer on page`);
        const player = windowObj.jwplayer();
        const config = player.getConfig ? player.getConfig() : {};

        // Playlists hold the file streams
        const playlists = config.playlist || [];
        const streams = [];

        for (const item of playlists) {
            if (item.sources) {
                for (const source of item.sources) {
                    streams.push({
                        url: source.file,
                        type: source.type,
                        label: source.label || 'unknown_quality',
                        drm: item.drm || null // Captures FairPlay/Widevine certs if present
                    });
                }
            } else if (item.file) {
                streams.push({ url: item.file });
            }
        }

        return {
            player: 'jwplayer',
            version: player.version || 'unknown',
            streams,
            rawConfig: config
        };
    }
}

module.exports = JWPlayerExtractor;
