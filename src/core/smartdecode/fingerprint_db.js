const fs = require('fs');
const path = require('path');

class FingerprintDB {
    constructor() {
        this.fingerprints = [];
        this.loadSignatures();
    }

    loadSignatures() {
        const dir = path.join(__dirname, 'fingerprints');
        if (!fs.existsSync(dir)) return;

        try {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
            for (const f of files) {
                const data = fs.readFileSync(path.join(dir, f), 'utf-8');
                this.fingerprints.push(JSON.parse(data));
            }
        } catch (e) {
            console.error("[FingerprintDB] Error loading signatures:", e.message);
        }
    }

    matchFingerprint(context) {
        let bestMatch = null;
        let highestScore = 0;

        for (const fp of this.fingerprints) {
            let score = 0;
            let totalWeight = 0;

            // Check Window Objects (highest signal)
            if (fp.window_objects && context.playerConfig) {
                totalWeight += fp.window_objects.length * 2;
                fp.window_objects.forEach(obj => {
                    if (context.playerConfig.includes(`"${obj}"`) || context.playerConfig.includes(`'${obj}'`) || context.playerConfig.includes(`${obj}:`)) {
                        score += 2;
                    }
                });
            }

            // Check DOM Signatures
            if (fp.dom_signatures && context.domSnapshot) {
                totalWeight += fp.dom_signatures.length;
                fp.dom_signatures.forEach(sig => {
                    const cleanSig = sig.replace('.', '').replace('#', '');
                    if (context.domSnapshot.includes(cleanSig)) {
                        score += 1;
                    }
                });
            }

            // Check Script Signatures
            if (fp.script_signatures && context.domSnapshot) {
                totalWeight += fp.script_signatures.length;
                fp.script_signatures.forEach(sig => {
                    if (context.domSnapshot.includes(sig)) {
                        score += 1;
                    }
                });
            }

            // Check Known API calls in trace
            if (fp.known_api_calls && context.streamTrace && context.streamTrace.length > 0) {
                totalWeight += fp.known_api_calls.length;
                const traceStr = JSON.stringify(context.streamTrace);
                fp.known_api_calls.forEach(call => {
                    if (traceStr.includes(call)) {
                        score += 1;
                    }
                });
            }

            if (totalWeight > 0) {
                const normalizedScore = (score / totalWeight) * (fp.confidence_weight || 1.0);
                if (normalizedScore > highestScore && normalizedScore > 0.1) {
                    highestScore = normalizedScore;
                    bestMatch = fp.player_name;
                }
            }
        }

        if (bestMatch) {
            return { player: bestMatch, confidence: highestScore.toFixed(2) };
        }
        return { player: "Unknown", confidence: 0 };
    }
}

module.exports = { FingerprintDB };
