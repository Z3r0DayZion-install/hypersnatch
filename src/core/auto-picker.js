/**
 * AutoPicker
 * Logic to automatically select the best candidate or flag for manual review.
 */

const AutoPicker = {
    /**
     * Pick the best candidate from a list.
     * @param {Array} candidates Ranked and scored candidates
     * @param {Object} options Options like { autoSelect: true, minConfidence: 0.5 }
     * @returns {Object|null} The chosen candidate or null
     */
    pick(candidates, options = {}) {
        if (!candidates || candidates.length === 0) return null;

        const autoSelect = options.autoSelect !== false;
        const minConfidence = options.minConfidence || 0.4;

        const best = candidates[0];

        if (!autoSelect) return null;

        // If confidence is too low, don't auto-pick
        if ((best.finalScore || 0) < minConfidence) {
            return null;
        }

        // If it's a tie or very close, might want manual review, 
        // but for now we trust the ranker's first result if it's high enough.
        return best;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoPicker;
}
