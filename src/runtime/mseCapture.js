/**
 * HyperSnatch Phase 6: MSE Capture
 * Intercepts MediaSource Extension events to map buffered segments.
 */

class MSECapture {
    constructor() {
        this.events = [];
        this.isIntercepting = false;
    }

    start() {
        if (this.isIntercepting) return;
        this.isIntercepting = true;
        this.hookMSE();
        console.log("[MSE] Interception started.");
    }

    hookMSE() {
        const self = this;
        const originalAppendBuffer = SourceBuffer.prototype.appendBuffer;

        SourceBuffer.prototype.appendBuffer = function (data) {
            self.events.push({
                timestamp: Date.now(),
                type: 'appendBuffer',
                label: this.__label || 'unknown',
                byteLength: data.byteLength,
                sbState: {
                    updating: this.updating,
                    buffered: self.serializeTimeRanges(this.buffered)
                }
            });
            return originalAppendBuffer.apply(this, arguments);
        };
    }

    serializeTimeRanges(ranges) {
        const result = [];
        for (let i = 0; i < ranges.length; i++) {
            result.push({ start: ranges.start(i), end: ranges.end(i) });
        }
        return result;
    }

    getSnapshot() {
        return {
            captureTime: Date.now(),
            eventCount: this.events.length,
            events: this.events
        };
    }
}

module.exports = new MSECapture();
