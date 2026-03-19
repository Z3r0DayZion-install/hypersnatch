/**
 * clipboardWatcher.js
 * The core orchestrator for SmartSnatch Auto-Detect.
 * Replaces direct polling with history checks and strict signature mapping.
 */

const clipboardHistory = require('./clipboardHistory');
const { matchStrict } = require('./hostSignatureRules');
const decodeQueue = require('./decodeQueue');

class ClipboardWatcher {
    constructor() {
        this.readClipboardStrFn = null; // Platform specific bridge function
        this.interval = null;
        this.mode = 'OFF'; // OFF | QUEUE ONLY | AUTO DECODE | MANUAL REVIEW
        this.onEvent = null; // Metric/logging callback
    }

    // Inject the environment-specific clipboard reader 
    // (e.g., window.electronAPI.readClipboardText or navigator.clipboard.readText)
    setProvider(readerFn) {
        this.readClipboardStrFn = readerFn;
    }

    setMode(newMode) {
        this.mode = newMode;
    }

    setEventHandler(callback) {
        this.onEvent = callback;
    }

    start(pollRateMs = 1000) {
        if (this.interval) return;
        this.interval = setInterval(() => this._poll(), pollRateMs);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    async _poll() {
        if (this.mode === 'OFF' || !this.readClipboardStrFn) return;

        try {
            const text = await this.readClipboardStrFn();
            if (!text || typeof text !== 'string') return;

            // Rule 2 & 3: Debounce & History
            if (clipboardHistory.has(text)) return;

            // Rule 4: Strict Signatures
            const match = matchStrict(text);
            if (!match) return;

            // New valid target found! Track it in history to prevent loops.
            clipboardHistory.add(text);

            this._emitEvent('CLIPBOARD_MATCH', { host: match.host, url: text.substring(0, 100) });

            // Rule 1 & 10: Queue or Review, never decode directly from here
            if (this.mode === 'MANUAL REVIEW') {
                const job = decodeQueue.enqueue(match.url, match.host);
                if (job) {
                    decodeQueue.updateStatus(job.id, 'manual-review');
                    this._emitEvent('QUEUE_ADDED_MANUAL', { id: job.id, host: match.host });
                }
            } else {
                // QUEUE ONLY or AUTO DECODE mode (Scheduler decides if it runs)
                const job = decodeQueue.enqueue(match.url, match.host);
                if (job) {
                    this._emitEvent('QUEUE_ADDED', { id: job.id, host: match.host });
                }
            }

        } catch (err) {
            // Silent fail the poll loop to prevent crashing the UI process on locked clipboards
            this._emitEvent('POLL_ERROR', { error: err.message });
        }
    }

    _emitEvent(type, data) {
        if (this.onEvent) {
            this.onEvent(type, data);
        }
    }
}

module.exports = new ClipboardWatcher();
