// ==================== REFLEX ENGINE // COUNTER-INTEL ====================
"use strict";

const ReflexEngine = {
    // Known tracker/canary patterns
    threatPatterns: [
        /canarytokens\.com/i,
        /thinkst\.com/i,
        /webhook\.site/i,
        /burpcollaborator\.net/i,
        /pixel\.(png|gif|jpg)\?uid=/i,
        /track_id=/i
    ],

    /**
     * Scans evidence for investigator traps
     */
    analyze(evidence) {
        const threats = [];
        const serialized = JSON.stringify(evidence);

        this.threatPatterns.forEach(pattern => {
            if (pattern.test(serialized)) {
                threats.push({
                    pattern: pattern.toString(),
                    severity: "CRITICAL",
                    description: "TRAP DETECTED: Investigator tracking token identified."
                });
            }
        });

        return threats;
    },

    /**
     * Neutralizes detected traps by redirecting them to a Null-Zone
     */
    neutralize(data) {
        let cleanData = JSON.stringify(data);
        this.threatPatterns.forEach(pattern => {
            cleanData = cleanData.replace(pattern, "NULL_ZONE_PROTECTED");
        });
        return JSON.parse(cleanData);
    }
};

if (typeof window !== 'undefined') window.ReflexEngine = ReflexEngine;
module.exports = ReflexEngine;
