/**
 * FingerprintLibrary.js (Phase 73)
 * Persistent local library of known infrastructure signatures.
 * Supports add, search, compare, confidence updates, and export.
 */
const fs = require('fs');
const path = require('path');

class FingerprintLibrary {
    constructor(libraryPath = null) {
        this.libraryPath = libraryPath;
        this.entries = [];
        if (libraryPath && fs.existsSync(libraryPath)) {
            try {
                this.entries = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
            } catch { /* start fresh */ }
        }
    }

    /**
     * Add a fingerprint entry to the library.
     */
    add(entry) {
        entry.id = entry.id || `fp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        entry.addedAt = new Date().toISOString();
        entry.confidence = entry.confidence || 0.5;
        this.entries.push(entry);
        this._persist();
        return entry;
    }

    /**
     * Find entries by classification label.
     */
    findByLabel(label) {
        return this.entries.filter(e => e.label === label);
    }

    /**
     * Find entries similar to given features (exact match on all provided keys).
     */
    findSimilar(features = {}) {
        return this.entries.filter(e => {
            return Object.keys(features).every(key => {
                const eVal = typeof e[key] === 'string' ? e[key].toLowerCase() : e[key];
                const fVal = typeof features[key] === 'string' ? features[key].toLowerCase() : features[key];
                return eVal === fVal;
            });
        });
    }

    /**
     * Compare a candidate against the library and return match details.
     */
    compare(candidate) {
        const matches = [];
        for (const entry of this.entries) {
            let matchingFeatures = 0;
            let totalFeatures = 0;
            for (const key of ['cdn', 'player', 'protocol', 'label']) {
                if (candidate[key] && entry[key]) {
                    totalFeatures++;
                    if (candidate[key].toString().toLowerCase() === entry[key].toString().toLowerCase()) {
                        matchingFeatures++;
                    }
                }
            }
            if (totalFeatures > 0 && matchingFeatures > 0) {
                matches.push({
                    libraryEntry: entry.id,
                    label: entry.label,
                    similarity: Math.round((matchingFeatures / totalFeatures) * 100) / 100,
                    matchingFeatures,
                    totalFeatures
                });
            }
        }
        return matches.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Update the confidence of an existing entry.
     */
    updateConfidence(entryId, newConfidence) {
        const entry = this.entries.find(e => e.id === entryId);
        if (entry) {
            entry.confidence = newConfidence;
            entry.updatedAt = new Date().toISOString();
            this._persist();
        }
        return entry;
    }

    /**
     * Export the entire library.
     */
    export() {
        return {
            exportedAt: new Date().toISOString(),
            totalEntries: this.entries.length,
            entries: this.entries
        };
    }

    getStats() {
        const labels = {};
        this.entries.forEach(e => { labels[e.label || 'UNLABELED'] = (labels[e.label || 'UNLABELED'] || 0) + 1; });
        return {
            totalEntries: this.entries.length,
            uniqueLabels: Object.keys(labels).length,
            labelDistribution: labels,
            avgConfidence: this.entries.length > 0
                ? Math.round(this.entries.reduce((s, e) => s + (e.confidence || 0), 0) / this.entries.length * 100) / 100
                : 0
        };
    }

    _persist() {
        if (this.libraryPath) {
            const dir = path.dirname(this.libraryPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.libraryPath, JSON.stringify(this.entries, null, 2));
        }
    }
}

module.exports = FingerprintLibrary;
