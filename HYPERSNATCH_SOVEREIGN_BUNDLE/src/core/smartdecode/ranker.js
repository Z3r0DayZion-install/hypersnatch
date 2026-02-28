/**
 * SmartDecode 2.0 - Candidate Ranking Module
 * Heuristic scoring engine to identify the best stream candidates.
 */

const Ranker = {
    /**
     * Rank a list of candidates
     * @param {Array} candidates 
     * @returns {Object} { candidates: sortedList, best: topCandidate }
     */
    rank(candidates) {
        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return { candidates: [], best: null };
        }

        const ranked = candidates.map(c => {
            let score = c.confidence || 0.5;

            try {
                c.host = new URL(c.url).hostname || "";
            } catch (e) {
                c.host = "";
                score = 0; // Deterministically demote malformed URLs
            }

            // 1. Type Boosts
            if (c.type === 'hls' || c.type === 'm3u8') score += 0.2; // Master playlists are gold
            if (c.type === 'hls_variant') score += 0.15;
            if (c.type === 'mp4') score += 0.1;

            // 2. Resolution Boosts
            if (c.height) {
                if (c.height >= 1080) score += 0.3;
                else if (c.height >= 720) score += 0.2;
                else if (c.height >= 480) score += 0.1;
            }

            // 3. Keyword/Pattern Boosts
            const urlLower = c.url.toLowerCase();
            if (urlLower.includes('1080p') || urlLower.includes('fhd')) score += 0.1;
            if (urlLower.includes('720p') || urlLower.includes('hd-')) score += 0.05;
            if (urlLower.includes('master')) score += 0.1;

            // 4. Source Layer Boosts
            if (c.sourceLayer === 'hls_focused') score += 0.1;
            if (c.sourceLayer === 'unpacker_result') score += 0.05;

            // Final normalization
            if (c.host === "") {
                c.finalScore = 0;
            } else {
                c.finalScore = Math.min(1, score);
            }
            return c;
        });

        // Sort descending
        ranked.sort((a, b) => b.finalScore - a.finalScore);

        return {
            candidates: ranked,
            best: ranked[0]
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Ranker;
}
