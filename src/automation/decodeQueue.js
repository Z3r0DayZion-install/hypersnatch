/**
 * decodeQueue.js
 * In-memory stateful queue for SmartSnatch automation runs.
 */

const crypto = require('crypto');

class DecodeQueue {
    constructor() {
        this.queue = [];
        this.history = []; // Keep track of finished/failed jobs for UI reporting
    }

    enqueue(url, host) {
        // Prevent duplicate active queueing
        if (this.queue.find(j => j.url === url)) {
            return null;
        }

        const job = {
            id: crypto.randomUUID(),
            url: url,
            host: host,
            status: 'pending', // pending, active, completed, failed, manual-review
            addedAt: Date.now(),
            finishedAt: null,
            error: null
        };

        this.queue.push(job);
        return job;
    }

    dequeue() {
        const nextJob = this.queue.find(j => j.status === 'pending');
        if (nextJob) {
            nextJob.status = 'active';
            return nextJob;
        }
        return null;
    }

    updateStatus(id, newStatus, errorStr = null) {
        const job = this.queue.find(j => j.id === id);
        if (!job) return false;

        job.status = newStatus;
        if (['completed', 'failed', 'manual-review'].includes(newStatus)) {
            job.finishedAt = Date.now();
            job.error = errorStr;

            // Move to history
            this.history.push({ ...job });
            this.queue = this.queue.filter(j => j.id !== id);
        }
        return true;
    }

    remove(id) {
        this.queue = this.queue.filter(j => j.id !== id);
    }

    getQueue() {
        return [...this.queue];
    }

    getHistory(limit = 50) {
        // Return last N history items, newest first
        return [...this.history].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, limit);
    }

    getMetrics() {
        const totalCompleted = this.history.filter(j => j.status === 'completed').length;
        const totalFailed = this.history.filter(j => j.status === 'failed').length;
        return {
            pending: this.queue.length,
            completed: totalCompleted,
            failed: totalFailed
        };
    }
}

module.exports = new DecodeQueue();
