/**
 * CrossCaseMiner.js (Phase 74)
 * Mines relationships across multiple forensic cases.
 * Detects shared infrastructure, recurring findings, and suggests case merges.
 */
class CrossCaseMiner {
    constructor() {
        this.results = null;
    }

    /**
     * Mine shared infrastructure patterns across multiple cases.
     */
    mine(cases = []) {
        const sharedInfra = new Map();
        const recurringFindings = new Map();

        cases.forEach(c => {
            const caseId = c.id || 'unknown';
            (c.bundles || []).forEach(b => {
                const cdn = (b.cdn || 'unknown').toLowerCase();
                const player = (b.playerSignature || b.player || 'unknown').toLowerCase();
                const protocol = (b.protocol || 'unknown').toLowerCase();
                const key = `${cdn}::${player}::${protocol}`;

                if (!sharedInfra.has(key)) {
                    sharedInfra.set(key, { key, cdn, player, protocol, cases: new Set(), bundles: [] });
                }
                sharedInfra.get(key).cases.add(caseId);
                sharedInfra.get(key).bundles.push({ caseId, bundleId: b.path || b.id || 'unknown' });
            });

            // Mine findings
            (c.findings || []).forEach(f => {
                const fKey = f.category || f.type || 'general';
                if (!recurringFindings.has(fKey)) {
                    recurringFindings.set(fKey, { category: fKey, cases: new Set(), count: 0 });
                }
                recurringFindings.get(fKey).cases.add(caseId);
                recurringFindings.get(fKey).count++;
            });
        });

        // Convert Sets to arrays for serialization
        const sharedGroups = Array.from(sharedInfra.values())
            .map(g => ({ ...g, cases: Array.from(g.cases), crossCase: g.cases.size > 1 }))
            .filter(g => g.crossCase)
            .sort((a, b) => b.cases.length - a.cases.length);

        const findingGroups = Array.from(recurringFindings.values())
            .map(g => ({ ...g, cases: Array.from(g.cases), crossCase: g.cases.size > 1 }))
            .filter(g => g.crossCase);

        // Suggest merges
        const mergeSuggestions = this._suggestMerges(sharedGroups);

        this.results = {
            sharedInfrastructureGroups: sharedGroups,
            recurringFindings: findingGroups,
            mergeSuggestions,
            totalCasesAnalyzed: cases.length,
            crossCaseLinks: sharedGroups.length
        };

        return this.results;
    }

    _suggestMerges(sharedGroups) {
        const suggestions = [];
        sharedGroups.forEach(g => {
            if (g.cases.length >= 2) {
                suggestions.push({
                    type: 'MERGE_SUGGESTION',
                    reason: `Cases ${g.cases.join(', ')} share infrastructure: ${g.key}`,
                    cases: g.cases,
                    confidence: Math.min(0.5 + (g.bundles.length * 0.1), 0.95),
                    evidence: g.key
                });
            }
        });
        return suggestions;
    }

    getStats() {
        if (!this.results) return { analyzed: false };
        return {
            crossCaseLinks: this.results.crossCaseLinks,
            recurringFindings: this.results.recurringFindings.length,
            mergeSuggestions: this.results.mergeSuggestions.length,
            totalCases: this.results.totalCasesAnalyzed
        };
    }
}

module.exports = CrossCaseMiner;
