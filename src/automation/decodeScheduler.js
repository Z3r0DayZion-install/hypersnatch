/**
 * decodeScheduler.js
 * Pops items from the DecodeQueue exactly when the RateLimiter allows,
 * enforcing strict serial execution.
 */

const decodeQueue = require('./decodeQueue');
const rateLimiter = require('./rateLimiter');

class DecodeScheduler {
    constructor() {
        this.interval = null;
        this.isRunning = false;
        this.activeJob = null; // Currently executing job
        this.executeCallback = null; // Provided by the consumer (e.g. UI or main process)
    }

    setExecutor(callback) {
        // Callback should be an async function taking (job.url, job.host)
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

    async _tick() {
        // If we're already waiting on a job, don't start a new one (strict serial)
        if (this.activeJob) return;

        // Check rate limit
        if (!rateLimiter.canExecute()) return;

        // Check queue
        const nextJob = decodeQueue.dequeue();
        if (!nextJob) return;

        // We have a job and rate limit allows it
        rateLimiter.recordExecution();
        this.activeJob = nextJob;

        try {
            if (this.executeCallback) {
                await this.executeCallback(nextJob.url, nextJob.host);
            }
            decodeQueue.updateStatus(nextJob.id, 'completed');
        } catch (err) {
            decodeQueue.updateStatus(nextJob.id, 'failed', err.message || String(err));
        } finally {
            this.activeJob = null; // Free up the scheduler
        }
    }
}

module.exports = new DecodeScheduler();
