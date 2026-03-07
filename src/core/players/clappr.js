"use strict";

/**
 * Extracts streams and manifests from Clappr
 */
class ClapprExtractor {
    static identify(windowObj) {
        return !!windowObj.Clappr;
    }

    static extract(windowObj) {
        console.log(`[ClapprExtractor] Found Clappr on page`);

        return {
            player: 'clappr',
            streams: [], // Actual stream extraction requires DOM traversal for Clappr instances or window hooks
            rawConfig: {}
        };
    }
}

module.exports = ClapprExtractor;
