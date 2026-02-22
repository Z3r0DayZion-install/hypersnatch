"use strict";

const path = require("path");

const DownloadPlan = {
    /**
     * Generates an actionable download plan from a SmartDecode candidate.
     * 
     * @param {Object} candidate - Ranked candidate from SmartDecode
     * @param {string} outputFilename - Desired filename
     * @param {string} outputPath - Desired destination directory
     * @returns {Object|null} The download plan containing system commands
     */
    generate(candidate, outputFilename = "video.mp4", outputPath = "./") {
        if (!candidate || !candidate.url) return null;

        const url = candidate.url;
        const type = candidate.type || "unknown";

        // Escape characters safely for standard shell use
        const safeOutput = path.join(outputPath, outputFilename).replace(/"/g, '\\"');

        let command = "";

        // FFmpeg is required for stitching HLS playlists into a single reliable mp4
        if (type === "m3u8" || type === "hls" || url.includes(".m3u8")) {
            command = `ffmpeg -i "${url}" -c copy "${safeOutput}"`;
        }
        // aria2c is optimal for concurrent multi-connection static file downloads
        else {
            command = `aria2c -c -x16 -s16 -d "${outputPath}" -o "${outputFilename}" "${url}"`;
        }

        return {
            filename: outputFilename,
            destination: outputPath,
            command: command,
            engine: command.startsWith("ffmpeg") ? "ffmpeg" : "aria2c",
            rawCandidate: candidate
        };
    }
};

module.exports = DownloadPlan;
