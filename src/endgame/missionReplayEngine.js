/**
 * MissionReplayEngine.js (Phase 96)
 * Reconstructs the investigative timeline from signal ingestion to final conclusion.
 */
class MissionReplayEngine {
    constructor() {
        this.replays = [];
    }

    generateReplay(caseId, events) {
        if (!events || !Array.isArray(events)) {
            throw new Error("Events array is required for mission replay");
        }

        const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

        // Calculate key transition points
        let ingestionTime = null;
        let attributionTime = null;
        let conclusionTime = null;

        for (const ev of sortedEvents) {
            if (ev.type === 'ingestion' && !ingestionTime) ingestionTime = ev.timestamp;
            if (ev.type === 'attribution' && !attributionTime) attributionTime = ev.timestamp;
            if (ev.type === 'conclusion') conclusionTime = ev.timestamp;
        }

        const replayLog = {
            id: `replay_${Date.now()}_${caseId}`,
            caseId,
            timeToAttributionMs: attributionTime && ingestionTime ? attributionTime - ingestionTime : null,
            totalMissionTimeMs: conclusionTime && ingestionTime ? conclusionTime - ingestionTime : null,
            milestones: sortedEvents.filter(e => ['ingestion', 'attribution', 'conclusion'].includes(e.type)),
            fullLog: sortedEvents,
            generatedAt: new Date().toISOString()
        };

        this.replays.push(replayLog);
        return replayLog;
    }

    getReplay(caseId) {
        return this.replays.find(r => r.caseId === caseId) || null;
    }
}

module.exports = MissionReplayEngine;
