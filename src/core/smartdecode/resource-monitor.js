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
     * Optional wait based on current load
     */
    async adaptiveDelay() {
        const load = this.checkLoad();
        if (load.factor > 1.2) {
            const delay = Math.round((load.factor - 1) * 100);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = ResourceMonitor;
