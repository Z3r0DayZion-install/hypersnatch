"use strict";

const assert = require('assert');
const fs = require('fs');
const StreamReconstructionPipeline = require('../../src/core/reconstruction/pipeline');

async function runTests() {
    console.log("--- Running Pipeline Reconstruction Tests ---");

    const pipeline = new StreamReconstructionPipeline();

    // Test HLS stub
    const hlsOut = await pipeline.buildFromPlaylist('http://example.com/stream.m3u8', 'hls');
    assert.ok(hlsOut, "Pipeline should return a reconstructed output file path for HLS");
    assert.ok(fs.existsSync(hlsOut), "Output file should actually exist on disk");

    // Test DASH stub
    const dashOut = await pipeline.buildFromPlaylist('http://example.com/manifest.mpd', 'dash');
    assert.ok(dashOut, "Pipeline should return a reconstructed output file path for DASH");
    assert.ok(fs.existsSync(dashOut), "Output file should actually exist on disk");

    // Cleanup workdir
    fs.rmSync(pipeline.workDir, { recursive: true, force: true });

    console.log("Pipeline Reconstruction Tests Passed!\n");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
