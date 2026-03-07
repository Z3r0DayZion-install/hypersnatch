"use strict";

const assert = require('assert');

// A quick simulated DOM environment to test mse_hook.js injection side effects
global.window = {
    postMessage: function (msg, origin) {
        this.messages.push({ msg, origin });
    },
    messages: []
};

// Mock MediaSource and SourceBuffer
class MockSourceBuffer {
    appendBuffer(data) {
        return true; // Mock success
    }
}

class MockMediaSource {
    constructor() {
        this.sourceBuffers = [];
    }
    addSourceBuffer(mime) {
        const sb = new MockSourceBuffer();
        this.sourceBuffers.push(sb);
        return sb;
    }
}

global.window.MediaSource = MockMediaSource;
global.window.SourceBuffer = MockSourceBuffer;
global.window.__hyperSnatchMSEHooked = false;

// Load the hook script
require('../../src/core/interceptors/mse_hook.js');

function runTests() {
    console.log("--- Running MSE Hook Tests ---");

    // Test hook injection
    assert.strictEqual(global.window.__hyperSnatchMSEHooked, true, "Hook should have set the injected flag");

    // Test addSourceBuffer interception
    const ms = new global.window.MediaSource();
    const sb = ms.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');

    const createMsg = global.window.messages.find(m => m.msg.type === 'STREAM_TRACK_CREATED');
    assert.ok(createMsg, "Should emit STREAM_TRACK_CREATED message");
    assert.strictEqual(createMsg.msg.payload.mimeType, 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');

    // Test appendBuffer interception
    const mockData = Buffer.from('mock video data bytes');
    sb.appendBuffer(mockData);

    const appendMsg = global.window.messages.find(m => m.msg.type === 'MEDIA_SEGMENT');
    assert.ok(appendMsg, "Should emit MEDIA_SEGMENT message");
    assert.strictEqual(appendMsg.msg.payload.size, mockData.length, "Captured size should match buffer size");

    console.log("MSE Hook Tests Passed!\n");
}

runTests();
