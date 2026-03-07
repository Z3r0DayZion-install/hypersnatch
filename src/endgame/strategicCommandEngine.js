/**
 * StrategicCommandEngine.js (Phase 100)
 * Unifies all engines (Replay, Counterfactual, Constitution, Challenge)
 * into a single analyst routing command layer.
 */
class StrategicCommandEngine {
    constructor(replayEngine, counterfactualEngine, evidenceEngine, challengeEngine) {
        this.replayEngine = replayEngine;
        this.counterfactualEngine = counterfactualEngine;
        this.evidenceEngine = evidenceEngine;
        this.challengeEngine = challengeEngine;
        this.unifiedLog = [];
    }

    executeCommand(command, payload) {
        let result = null;

        try {
            switch (command) {
                case 'REPLAY_MISSION':
                    result = this.replayEngine.generateReplay(payload.caseId, payload.events);
                    break;
                case 'TEST_COUNTERFACTUAL':
                    result = this.counterfactualEngine.simulateRemoval(payload.evidenceId, payload.graph);
                    break;
                case 'WEIGH_EVIDENCE':
                    result = this.evidenceEngine.calculateWeight(payload.evidenceArray);
                    break;
                case 'CHALLENGE_CONCLUSION':
                    result = this.challengeEngine.challenge(payload.conclusion, payload.attribution, payload.gaps);
                    break;
                default:
                    throw new Error(`Unknown strategic command: ${command}`);
            }

            this.unifiedLog.push({ command, target: payload.caseId || payload.evidenceId || 'general', success: true, timestamp: Date.now() });
            return result;

        } catch (err) {
            this.unifiedLog.push({ command, error: err.message, success: false, timestamp: Date.now() });
            throw err;
        }
    }

    getCommandHistory() {
        return this.unifiedLog;
    }
}

module.exports = StrategicCommandEngine;
