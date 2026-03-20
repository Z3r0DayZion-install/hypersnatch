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

const MAX_ACTION_LOG = 25;

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

    _cloneJob(job) {
        return {
            ...job,
            actionLog: Array.isArray(job.actionLog) ? job.actionLog.map((entry) => ({ ...entry })) : [],
            lastAction: job.lastAction ? { ...job.lastAction } : null,
            lastResultSummary: job.lastResultSummary ? { ...job.lastResultSummary } : null
        };
    }

    _recordAction(job, action, detail = null, by = "system") {
        const entry = {
            at: Date.now(),
            action,
            status: job.status,
            by,
            detail: detail || null
        };
        if (!Array.isArray(job.actionLog)) job.actionLog = [];
        job.actionLog.push(entry);
        if (job.actionLog.length > MAX_ACTION_LOG) {
            job.actionLog = job.actionLog.slice(job.actionLog.length - MAX_ACTION_LOG);
        }
        job.lastAction = entry;
        job.updatedAt = entry.at;
        return entry;
    }

    _durationMs(job, finalAt) {
        const started = job.startedAt || job.addedAt || finalAt;
        return Math.max(0, finalAt - started);
    }

    _buildJob(url, host, options = {}) {
        const now = Date.now();
        const manualReview = Boolean(options.manualReview);
        const job = {
            id: crypto.randomUUID(),
            url: String(url || "").trim(),
            host: DecodeQueue._extractHost(url, host),
            status: manualReview ? STATUS.MANUAL_REVIEW : STATUS.QUEUED,
            source: options.source || "clipboard",
            caseId: options.caseId || null,
            caseTitle: options.caseTitle || null,
            context: options.context || null,
            attempts: 0,
            retryCount: 0,
            addedAt: now,
            updatedAt: now,
            startedAt: null,
            finishedAt: null,
            durationMs: null,
            error: null,
            lastError: null,
            failureReason: null,
            manualReviewReason: manualReview ? (options.manualReviewReason || "Queued for manual review.") : null,
            lastResultSummary: null,
            actionLog: [],
            lastAction: null
        };
        this._recordAction(
            job,
            manualReview ? "queued-manual-review" : "enqueued",
            `source=${job.source}`,
            options.actor || "system"
        );
        return job;
    }

    enqueue(url, host, options = {}) {
        const raw = String(url || "").trim();
        if (!raw) return null;

        const duplicate = this.queue.find((j) => j.url === raw && !TERMINAL_STATUSES.has(j.status));
        if (duplicate) return null;

        const job = this._buildJob(raw, host, options);
        this.queue.push(job);
        return this._cloneJob(job);
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
                    manualReview: Boolean(target.manualReview || options.manualReview),
                    manualReviewReason: target.manualReviewReason || options.manualReviewReason,
                    actor: target.actor || options.actor
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
        nextJob.attempts += 1;
        nextJob.retryCount = nextJob.attempts;
        this._recordAction(nextJob, "started", `attempt=${nextJob.attempts}`, "scheduler");
        return this._cloneJob(nextJob);
    }

    _finalize(job, status, error = null, summary = null, by = "scheduler") {
        const finishedAt = Date.now();
        job.status = status;
        job.error = error || null;
        if (error) job.lastError = error;
        job.lastResultSummary = summary || job.lastResultSummary;
        job.finishedAt = finishedAt;
        job.durationMs = this._durationMs(job, finishedAt);

        if (status === STATUS.FAILED || status === STATUS.CANCELED) {
            job.failureReason = error || job.failureReason || "Unspecified failure.";
        }
        if (status !== STATUS.MANUAL_REVIEW) {
            job.manualReviewReason = status === STATUS.MANUAL_REVIEW ? job.manualReviewReason : (job.manualReviewReason || null);
        }

        const detail = error || (summary && summary.message) || null;
        this._recordAction(job, status, detail, by);

        this.history.push(this._cloneJob(job));
        this.queue = this.queue.filter((q) => q.id !== job.id);
        return true;
    }

    complete(id, result) {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;

        const summary = DecodeQueue.summarizeResult(result);
        if (summary.kind === "ok") {
            return this._finalize(job, STATUS.COMPLETED, null, summary, "scheduler");
        }
        if (summary.kind === "warn") {
            return this._finalize(job, STATUS.WARNING, null, summary, "scheduler");
        }
        const reason = summary.message || "Decode produced no viable output.";
        return this._finalize(job, STATUS.FAILED, reason, summary, "scheduler");
    }

    fail(id, errorStr = null, result = null, by = "scheduler") {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;

        const summary = result ? DecodeQueue.summarizeResult(result) : null;
        return this._finalize(job, STATUS.FAILED, errorStr || "Decode failed.", summary, by);
    }

    pause(id, by = "operator") {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;
        if (job.status !== STATUS.QUEUED && job.status !== STATUS.MANUAL_REVIEW) return false;
        job.status = STATUS.PAUSED;
        this._recordAction(job, "paused", "Paused by operator.", by);
        return true;
    }

    resume(id, by = "operator") {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;
        if (job.status !== STATUS.PAUSED && job.status !== STATUS.MANUAL_REVIEW) return false;
        job.status = STATUS.QUEUED;
        this._recordAction(job, "resumed", "Queued for next scheduler slot.", by);
        return true;
    }

    cancel(id, reason = "Cancelled by operator.", by = "operator") {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;
        if (job.status === STATUS.RUNNING) return false;
        return this._finalize(job, STATUS.CANCELED, reason, job.lastResultSummary, by);
    }

    markManualReview(id, reason = "Requires manual analyst review.", by = "operator") {
        const job = this.queue.find((q) => q.id === id);
        if (!job) return false;
        if (job.status === STATUS.RUNNING) return false;
        job.status = STATUS.MANUAL_REVIEW;
        job.manualReviewReason = reason;
        job.error = reason;
        this._recordAction(job, "manual-review", reason, by);
        return true;
    }

    requeue(id, by = "operator", reason = "Requeued by operator.") {
        const historyJob = this.history.find((h) => h.id === id);
        if (!historyJob) return false;
        const duplicate = this.queue.find((q) => q.url === historyJob.url && !TERMINAL_STATUSES.has(q.status));
        if (duplicate) return false;

        const clone = {
            ...this._cloneJob(historyJob),
            status: STATUS.QUEUED,
            error: null,
            failureReason: null,
            manualReviewReason: null,
            startedAt: null,
            finishedAt: null,
            durationMs: null,
            lastResultSummary: null
        };
        this._recordAction(clone, "requeued", reason, by);
        this.queue.push(clone);
        return true;
    }

    attachCase(id, caseId, caseTitle = null, by = "operator") {
        const update = (job) => {
            job.caseId = caseId || null;
            if (caseTitle) job.caseTitle = caseTitle;
            this._recordAction(job, "case-linked", `caseId=${caseId}`, by);
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
        if (normalized === "pending") return this.resume(id, "legacy");
        if (normalized === "active") {
            const job = this.queue.find((q) => q.id === id);
            if (!job) return false;
            if (job.status !== STATUS.QUEUED) return false;
            job.status = STATUS.RUNNING;
            job.startedAt = job.startedAt || Date.now();
            job.attempts += 1;
            job.retryCount = job.attempts;
            this._recordAction(job, "started", `attempt=${job.attempts}`, "legacy");
            return true;
        }
        if (normalized === "manual-review") return this.markManualReview(id, errorStr || "Moved to manual review.", "legacy");
        if (normalized === "paused") return this.pause(id, "legacy");
        if (normalized === "queued") return this.resume(id, "legacy");
        if (normalized === "canceled" || normalized === "cancelled") return this.cancel(id, errorStr || "Cancelled by operator.", "legacy");
        if (normalized === "completed") {
            return this.complete(id, { candidates: [{}], refusals: [] });
        }
        if (normalized === "warning") {
            const job = this.queue.find((q) => q.id === id);
            if (!job) return false;
            return this._finalize(job, STATUS.WARNING, errorStr || null, job.lastResultSummary, "legacy");
        }
        if (normalized === "failed") {
            return this.fail(id, errorStr || "Decode failed.", null, "legacy");
        }
        return false;
    }

    remove(id) {
        this.queue = this.queue.filter((j) => j.id !== id);
    }

    getQueue() {
        return this.queue.map((q) => this._cloneJob(q));
    }

    getHistory(limit = 50) {
        return [...this.history]
            .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
            .slice(0, limit)
            .map((h) => this._cloneJob(h));
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
        const retries = [...this.queue, ...this.history].reduce((sum, j) => sum + (j.retryCount || j.attempts || 0), 0);

        return {
            queued,
            running,
            paused,
            manualReview,
            pending: queued + running + paused + manualReview,
            completed,
            warning,
            failed,
            canceled,
            retries
        };
    }
}

module.exports = new DecodeQueue();
