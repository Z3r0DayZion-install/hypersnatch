/**
 * OperatorBehaviorEngine.js (Phase 101-150)
 * Models human-adversary behavioral patterns (infrastructure reuse, 
 * deployment timing clusters, signal cadence) across historical cases.
 */
class OperatorBehaviorEngine {
    constructor() {
        this.models = new Map();
    }

    modelBehavior(operatorId, telemetryLogs) {
        if (!telemetryLogs || telemetryLogs.length === 0) return null;

        let deployTimes = [];
        let infraTypes = new Set();
        let totalCadenceMs = 0;

        for (let i = 0; i < telemetryLogs.length; i++) {
            const log = telemetryLogs[i];
            if (log.type === 'deployment') deployTimes.push(new Date(log.timestamp).getUTCHours());
            if (log.infrastructure) infraTypes.add(log.infrastructure);

            if (i > 0) {
                totalCadenceMs += (new Date(log.timestamp) - new Date(telemetryLogs[i - 1].timestamp));
            }
        }

        // Determine working hours cluster
        const hourFreq = {};
        let peakHour = 0;
        let maxFreq = 0;
        deployTimes.forEach(h => {
            hourFreq[h] = (hourFreq[h] || 0) + 1;
            if (hourFreq[h] > maxFreq) {
                maxFreq = hourFreq[h];
                peakHour = h;
            }
        });

        const behaviorProfile = {
            operatorId,
            reusedInfrastructurePct: (infraTypes.size / Math.max(telemetryLogs.length, 1)) * 100,
            peakDeploymentHourUtc: peakHour,
            averageTaskCadenceMs: telemetryLogs.length > 1 ? totalCadenceMs / (telemetryLogs.length - 1) : 0,
            modelConfidence: telemetryLogs.length > 50 ? 'HIGH' : 'LOW'
        };

        this.models.set(operatorId, behaviorProfile);
        return behaviorProfile;
    }

    getProfile(operatorId) {
        return this.models.get(operatorId);
    }
}

module.exports = OperatorBehaviorEngine;
