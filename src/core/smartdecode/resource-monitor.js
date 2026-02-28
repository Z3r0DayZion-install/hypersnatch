/**
 * Resource Monitor
 * Dynamically throtles extraction based on system load.
 */

"use strict";

const ResourceMonitor = {
    /**
     * Checks if the system is under heavy load.
     * @returns {Object} { isHighLoad: boolean, factor: number }
     */
    checkLoad() {
        const memory = process.memoryUsage();
        const heapUsed = memory.heapUsed / 1024 / 1024; // MB
        const heapTotal = memory.heapTotal / 1024 / 1024; // MB

        const usageRatio = heapUsed / heapTotal;
        const isHighLoad = usageRatio > 0.8; // > 80% usage

        // Throttling factor: 1.0 (no throttle) to 5.0 (max throttle)
        let factor = 1.0;
        if (usageRatio > 0.5) factor = 1.0 + (usageRatio - 0.5) * 8; // Linear scaling after 50%

        return {
            isHighLoad,
            usageRatio,
            factor: Math.min(factor, 5.0),
            heapUsedMb: Math.round(heapUsed)
        };
    },

    /**
     * Measures event loop lag in ms
     */
    async getLag() {
        const start = Date.now();
        return new Promise(resolve => {
            setTimeout(() => resolve(Date.now() - start), 0);
        });
    },

    /**
     * Optional wait based on current load and event loop lag
     */
    async adaptiveDelay() {
        const load = this.checkLoad();
        const lag = await this.getLag();

        let waitMs = 0;

        // 1. Heap-based scaling (Aggressive Round 10)
        if (load.usageRatio > 0.9) {
            waitMs += 2000; // Critical pressure
        } else if (load.factor > 1.2) {
            waitMs += (load.factor - 1) * 200;
        }

        // 2. Lag-based scaling
        if (lag > 100) {
            waitMs += (lag - 100) * 5;
        }

        if (waitMs > 0) {
            // Add jitter
            const jitter = Math.random() * 100;
            await new Promise(resolve => setTimeout(resolve, waitMs + jitter));
        }
    }
};

module.exports = ResourceMonitor;
