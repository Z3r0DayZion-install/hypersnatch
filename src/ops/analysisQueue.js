/**
 * HyperSnatch Operations: Analysis Queue
 * Batch processing engine for multiple forensic bundles.
 */

class AnalysisQueue {
    constructor() {
        this.queue = [];
        this.status = "idle";
        this.results = [];
    }

    /**
     * addToQueue(bundlePath)
     * @param {string} bundlePath - Path to the .hyper bundle directory
     */
    addToQueue(bundlePath) {
        this.queue.push({
            path: bundlePath,
            status: "pending",
            addedAt: new Date()
        });
        console.log(`[Queue] Bundle added: ${bundlePath}`);
    }

    /**
     * processNext(analyzer)
     * @param {Function} analyzer - The analysis function to run on each bundle
     */
    async processNext(analyzer) {
        if (this.queue.length === 0 || this.status === "processing") return;

        this.status = "processing";
        const item = this.queue.shift();
        item.status = "running";

        try {
            console.log(`[Queue] Processing: ${item.path}`);
            const result = await analyzer(item.path);
            item.status = "completed";
            item.completedAt = new Date();
            this.results.push({ path: item.path, result: result });
        } catch (err) {
            item.status = "failed";
            item.error = err.message;
            console.error(`[Queue] Failed: ${item.path}`, err);
        } finally {
            this.status = "idle";
            this.processNext(analyzer); // Process next in queue
        }
    }
}

module.exports = new AnalysisQueue();
