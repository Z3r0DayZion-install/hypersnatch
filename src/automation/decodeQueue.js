/**
 * decodeQueue.js
 * Stateful queue for SmartSnatch operator and clipboard decode workflows.
 */

const crypto = require("crypto");

const STATUS = {
    QUEUED: "queued",
    RUNNING: "running",
    PAUSED: "paused",
    MANUAL_REVIEW: "manual-review",
    COMPLETED: "completed",
    WARNING: "warning",
    FAILED: "failed",
    CANCELED: "canceled"
};

const TERMINAL_STATUSES = new Set([
    STATUS.COMPLETED,
    STATUS.WARNING,
    STATUS.FAILED,
    STATUS.CANCELED
]);

class DecodeQueue {
    constructor() {
        this.queue = [];
        this.history = [];
    }

    static _extractHost(url, fallbackHost) {
        if (fallbackHost && typeof fallbackHost === "string" && fallbackHost.trim()) {
            return fallbackHost.trim();
        }
        try {
            return new URL(String(url || "")).hostname || "unknown";
        } catch (e) {
            return "raw-input";
        }
    }

    static summarizeResult(result) {
        if (!result) {
            return {
                kind: "bad",
                message: "No decode payload returned.",
                candidates: 0,
                refusals: 0,
                successfulJobs: 0,
                warningJobs: 0,
                failedJobs: 0,
                totalJobs: 0,
                bestUrl: null,
                bestHost: null
            };
        }

        if (result.batch && Array.isArray(result.jobs)) {
            const jobs = result.jobs;
            const successfulJobs = jobs.filter((j) => Array.isArray(j.candidates) && j.candidates.length > 0).length;
            const warningJobs = jobs.filter((j) => {
                const candidates = Array.isArray(j.candidates) ? j.candidates.length : 0;
                const refusals = Array.isArray(j.refusals) ? j.refusals.length : 0;
                return candidates === 0 && refusals > 0;
            }).length;
            const failedJobs = Math.max(0, jobs.length - successfulJobs - warningJobs);
            const bestUrls = jobs
                .map((j) => (j.best && j.best.url ? j.best.url : null))
                .filter(Boolean);

            let kind = "bad";
            if (successfulJobs > 0 && failedJobs === 0 && warningJobs === 0) {
                kind = "ok";
            } else if (successfulJobs > 0 || warningJobs > 0) {
                kind = "warn";
            }

            return {
                kind,
                message: `Batch decode: ${successfulJobs}/${jobs.length} jobs with viable candidates.`,
                candidates: jobs.reduce((sum, j) => sum + (Array.isArray(j.candidates) ? j.candidates.length : 0), 0),
                refusals: jobs.reduce((sum, j) => sum + (Array.isArray(j.refusals) ? j.refusals.length : 0), 0),
                successfulJobs,
                warningJobs,
                failedJobs,
                totalJobs: jobs.length,
                bestUrl: bestUrls[0] || null,
                bestHost: bestUrls[0] ? DecodeQueue._extractHost(bestUrls[0], null) : null
            };
        }

        const candidates = Array.isArray(result.candidates) ? result.candidates : [];
        const refusals = Array.isArray(result.refusals) ? result.refusals : [];
        const best = result.best || null;

        let kind = "bad";
        if (best && candidates.length > 0) {
            kind = "ok";
        } else if (candidates.length > 0 || refusals.length > 0) {
            kind = "warn";
        }

        return {
            kind,
            message: `Decode result: ${candidates.length} candidate(s), ${refusals.length} refusal(s).`,
            candidates: candidates.length,
            refusals: refusals.length,
            successfulJobs: candidates.length > 0 ? 1 : 0,
            warningJobs: candidates.length === 0 && refusals.length > 0 ? 1 : 0,
            failedJobs: candidates.length === 0 && refusals.length === 0 ? 1 : 0,
            totalJobs: 1,
            bestUrl: best && best.url ? best.url : null,
            bestHost: best && best.host ? best.host : null
        };
    }

    _buildJob(url, host, options = {}) {
        const now = Date.now();
        const manualReview = Boolean(options.manualReview);
        return {
            id: crypto.randomUUID(),
            url: String(url || "").trim(),
            host: DecodeQueue._extractHost(url, host),
            status: manualReview ? STATUS.MANUAL_REVIEW : STATUS.QUEUED,
            source: options.source || "clipboard",
            caseId: options.caseId || null,
            caseTitle: options.caseTitle || null,
            context: options.context || null,
            attempts: 0,
            addedAt: now,
            updatedAt: now,
            startedAt: null,
            finishedAt: null,
            error: null,
            lastResultSummary: null
        };
    }

    enqueue(url, host, options = {}) {
        const raw = String(url || "").trim();
        if (!raw) return null;

        // Prevent duplicate active work for the same URL.
        const duplicate = this.queue.find((j) => j.url === raw && !TERMINAL_STATUSES.has(j.status));
        if (duplicate) return null;

        const job = this._buildJob(raw, host, options);
        this.queue.push(job);
        return { ...job };
    }

    enqueueMany(targets, options = {}) {
        const added = [];
        const skipped = [];
        const list = Array.isArray(targets) ? targets : [];

        for (const target of list) {
            const raw = typeof target === "string" ? target : target && target.url;
            const host = typeof target === "object" && target ? target.host : null;
            const perTargetOptions = typeof target === "object" && target
                ? {
                    ...options,
                    source: target.source || options.source,
                    caseId: target.caseId || options.caseId,
                    caseTitle: target.caseTitle || options.caseTitle,
                    context: target.context || options.context,
                    manualReview: Boolean(target.manualReview || options.manualReview)
                }
                : options;

            const job = this.enqueue(raw, host, perTargetOptions);
            if (job) added.push(job);
            else skipped.push(String(raw || ""));
        }

        return { added, skipped };
    }

    dequeue() {
        const nextJob = this.queue.find((j) => j.status === STATUS.QUEUED);
        if (!nextJob) return null;

        nextJob.status = STATUS.RUNNING;
        nextJob.startedAt = nextJob.startedAt || Date.now();
        nextJob.updatedAt = Date.now();
        nextJob.attempts += 1;
        return { ...nextJob };
    }

    _finalize(job, status, error = null, summary = null) {
        job.status = status;
        job.error = error;
        job.lastResultSummary = summary || job.lastResultSummary;
        job.finishedAt = Date.now();
        job.updatedAt = job.finishedAt;

        this.history.push({ ...job });
        this.queue = this.queue.filter((q) => q.id !== job.id);
        return true;
    }

    complete(id, result) {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;

        const summary = DecodeQueue.summarizeResult(result);
        if (summary.kind === "ok") {
            return this._finalize(job, STATUS.COMPLETED, null, summary);
        }
        if (summary.kind === "warn") {
            return this._finalize(job, STATUS.WARNING, null, summary);
        }
        return this._finalize(job, STATUS.FAILED, summary.message || "Decode produced no viable output.", summary);
    }

    fail(id, errorStr = null, result = null) {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;

        const summary = result ? DecodeQueue.summarizeResult(result) : null;
        return this._finalize(job, STATUS.FAILED, errorStr || "Decode failed.", summary);
    }

    pause(id) {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;
        if (job.status !== STATUS.QUEUED && job.status !== STATUS.MANUAL_REVIEW) return false;
        job.status = STATUS.PAUSED;
        job.updatedAt = Date.now();
        return true;
    }

    resume(id) {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;
        if (job.status !== STATUS.PAUSED && job.status !== STATUS.MANUAL_REVIEW) return false;
        job.status = STATUS.QUEUED;
        job.updatedAt = Date.now();
        return true;
    }

    cancel(id, reason = "Cancelled by operator.") {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;
        if (job.status === STATUS.RUNNING) return false;
        return this._finalize(job, STATUS.CANCELED, reason, job.lastResultSummary);
    }

    markManualReview(id, reason = null) {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;
        if (job.status === STATUS.RUNNING) return false;
        job.status = STATUS.MANUAL_REVIEW;
        job.updatedAt = Date.now();
        if (reason) job.error = reason;
        return true;
    }

    requeue(id) {
        const historyJob = this.history.find((h) => h.id === id);
        if (!historyJob) return false;
        const duplicate = this.queue.find((q) => q.url === historyJob.url && !TERMINAL_STATUSES.has(q.status));
        if (duplicate) return false;

        const clone = {
            ...historyJob,
            status: STATUS.QUEUED,
            error: null,
            startedAt: null,
            finishedAt: null,
            updatedAt: Date.now(),
            lastResultSummary: null
        };
        this.queue.push(clone);
        return true;
    }

    attachCase(id, caseId, caseTitle = null) {
        const update = (job) => {
            job.caseId = caseId || null;
            if (caseTitle) job.caseTitle = caseTitle;
            job.updatedAt = Date.now();
            return true;
        };

        const queued = this.queue.find((q) => q.id === id);
        if (queued) return update(queued);

        const historyJob = this.history.find((h) => h.id === id);
        if (historyJob) return update(historyJob);

        return false;
    }

    clearHistory() {
        this.history = [];
    }

    updateStatus(id, newStatus, errorStr = null) {
        // Legacy compatibility path for existing callers.
        const normalized = String(newStatus || "").toLowerCase();
        if (normalized === "pending") return this.resume(id);
        if (normalized === "active") {
            const job = this.queue.find((q) => q.id === id);
            if (!job) return false;
            if (job.status !== STATUS.QUEUED) return false;
            job.status = STATUS.RUNNING;
            job.startedAt = job.startedAt || Date.now();
            job.updatedAt = Date.now();
            return true;
        }
        if (normalized === "manual-review") return this.markManualReview(id, errorStr);
        if (normalized === "paused") return this.pause(id);
        if (normalized === "queued") return this.resume(id);
        if (normalized === "canceled" || normalized === "cancelled") return this.cancel(id, errorStr || "Cancelled by operator.");
        if (normalized === "completed") {
            return this.complete(id, { candidates: [{}], refusals: [] });
        }
        if (normalized === "warning") {
            const job = this.queue.find((q) => q.id === id);
            if (!job) return false;
            return this._finalize(job, STATUS.WARNING, errorStr || null, job.lastResultSummary);
        }
        if (normalized === "failed") {
            return this.fail(id, errorStr || "Decode failed.");
        }
        return false;
    }

    remove(id) {
        this.queue = this.queue.filter((j) => j.id !== id);
    }

    getQueue() {
        return this.queue.map((q) => ({ ...q }));
    }

    getHistory(limit = 50) {
        return [...this.history]
            .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
            .slice(0, limit)
            .map((h) => ({ ...h }));
    }

    getMetrics() {
        const queued = this.queue.filter((j) => j.status === STATUS.QUEUED).length;
        const running = this.queue.filter((j) => j.status === STATUS.RUNNING).length;
        const paused = this.queue.filter((j) => j.status === STATUS.PAUSED).length;
        const manualReview = this.queue.filter((j) => j.status === STATUS.MANUAL_REVIEW).length;
        const completed = this.history.filter((j) => j.status === STATUS.COMPLETED).length;
        const warning = this.history.filter((j) => j.status === STATUS.WARNING).length;
        const failed = this.history.filter((j) => j.status === STATUS.FAILED).length;
        const canceled = this.history.filter((j) => j.status === STATUS.CANCELED).length;

        return {
            queued,
            running,
            paused,
            manualReview,
            pending: queued + running + paused + manualReview,
            completed,
            warning,
            failed,
            canceled
        };
    }
}

module.exports = new DecodeQueue();
