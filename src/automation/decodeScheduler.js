/**
 * decodeScheduler.js
 * Pops queued jobs only when the RateLimiter allows and executes serially.
 */

const decodeQueue = require("./decodeQueue");
const rateLimiter = require("./rateLimiter");

class DecodeScheduler {
    constructor() {
        this.interval = null;
        this.isRunning = false;
        this.activeJob = null;
        this.executeCallback = null;
    }

    setExecutor(callback) {
        // Callback signature: async (job) => decodeResult
        this.executeCallback = callback;
    }

    start(tickRateMs = 1000) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.interval = setInterval(() => this._tick(), tickRateMs);
    }

    stop() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    getActiveJob() {
        return this.activeJob ? { ...this.activeJob } : null;
    }

    async _tick() {
        if (this.activeJob) return;
        if (!rateLimiter.canExecute()) return;

        const nextJob = decodeQueue.dequeue();
        if (!nextJob) return;

        rateLimiter.recordExecution();
        this.activeJob = nextJob;

        try {
            const executionResult = this.executeCallback ? await this.executeCallback(nextJob) : null;
            decodeQueue.complete(nextJob.id, executionResult);
        } catch (err) {
            decodeQueue.fail(nextJob.id, err && err.message ? err.message : String(err));
        } finally {
            this.activeJob = null;
        }
    }
}

module.exports = new DecodeScheduler();
