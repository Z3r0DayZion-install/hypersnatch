"use strict";

/**
 * Re-multiplexes (muxes) raw segments into a playable container format
 */
class Muxer {
    /**
     * Merges an array of buffers (e.g. TS fragments or MP4 fragments)
     * @param {Buffer[]} buffers 
     * @returns {Buffer}
     */
    static merge(buffers) {
        console.log(`[Muxer] Muxing ${buffers.length} segments...`);
        // Basic concatenation for simple Fragmented MP4 or TS files.
        // For more complex muxing (e.g. separate audio and video DASH streams into a single MP4), 
        // we would use a tool like ffmpeg/mp4box.
        return Buffer.concat(buffers);
    }
}

module.exports = Muxer;
