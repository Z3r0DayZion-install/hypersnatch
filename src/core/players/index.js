"use strict";

const JWPlayerExtractor = require('./jwplayer');
const VideoJSExtractor = require('./videojs');
const ShakaExtractor = require('./shaka');
const HlsJsExtractor = require('./hlsjs');
const FlowplayerExtractor = require('./flowplayer');
const ClapprExtractor = require('./clappr');
const PlyrExtractor = require('./plyr');

/**
 * Master Player Interface Agent
 * Scans a given window context for known players and extracts streams.
 */
class PlayerInterfaceFactory {
    static extractAllAvailable(windowObj) {
        const results = [];
        const extractors = [
            JWPlayerExtractor,
            VideoJSExtractor,
            ShakaExtractor,
            HlsJsExtractor,
            FlowplayerExtractor,
            ClapprExtractor,
            PlyrExtractor
        ];

        for (const extractor of extractors) {
            try {
                if (extractor.identify(windowObj)) {
                    results.push(extractor.extract(windowObj));
                }
            } catch (err) {
                console.error(`[PlayerInterface] Error extracting with ${extractor.name}:`, err);
            }
        }

        return results;
    }
}

module.exports = PlayerInterfaceFactory;
