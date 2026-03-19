/**
 * clipboardHistory.js
 * Tracks recent clipboard values to prevent duplicate decode attempts.
 * Implements a simple time-based LRU or TTL cache.
 */

class ClipboardHistory {
    constructor(ttlMs = 300000) { // Default 5 minute memory
        this.memory = new Map();
        this.ttlMs = ttlMs;
    }

    has(text) {
        if (!text) return false;
        this._cleanup();
        return this.memory.has(text);
    }

    add(text) {
        if (!text) return;
        this.memory.set(text, Date.now());
    }

    clear() {
        this.memory.clear();
    }

    _cleanup() {
        const now = Date.now();
        for (const [text, timestamp] of this.memory.entries()) {
            if (now - timestamp > this.ttlMs) {
                this.memory.delete(text);
            }
        }
    }
}

module.exports = new ClipboardHistory();
