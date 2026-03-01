/**
 * SmartDecode 2.4.0 - Candidate Ranking Module
 * Heuristic scoring engine to identify the best stream candidates.
 * v2.4.0: Multi-source tag multiplicity, host-specific pattern boosts,
 *         source-count confidence scaling, URL deduplication.
 */

const Ranker = {
    /**
     * Host-specific URL patterns that indicate high-value streams.
     * Each entry: { hostPattern: RegExp, urlPatterns: RegExp[], boost: number }
     */
    HOST_BOOSTS: [
        {
            hostPattern: /emload\.com/i,
            urlPatterns: [/\/stream\//i, /\/dl\//i, /\/vip\//i, /\/get\//i],
            boost: 0.15,
        },
        {
            hostPattern: /(?:kshared|khared)\.com/i,
            urlPatterns: [/\/file\//i, /\/dl\//i],
            boost: 0.1,
        },
        {
            hostPattern: /rapidgator\.net/i,
            urlPatterns: [/\/download\//i, /\/file\//i],
            boost: 0.1,
        },
    ],

    /**
     * Rank a list of candidates
     * @param {Array} candidates
     * @param {Object} [context] - Optional context: { sourceTagCount }
     * @returns {Object} { candidates: sortedList, best: topCandidate }
     */
    rank(candidates, context) {
        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return { candidates: [], best: null };
        }

        const ctx = context || {};
        const sourceTagCount = ctx.sourceTagCount || 0;

        // Deduplicate by URL before scoring
        const seen = new Map();
        for (const c of candidates) {
            const key = String(c.url || "");
            if (!key) continue;
            if (!seen.has(key)) {
                seen.set(key, c);
            }
        }
        const unique = Array.from(seen.values());

        const ranked = unique.map(c => {
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

            // 5. Multi-Source Tag Multiplicity Boost
            //    Pages with multiple <source> tags indicate richer extraction.
            //    The highest-quality candidate from such a page gets a bonus.
            if (sourceTagCount > 1) {
                score += Math.min(0.1, sourceTagCount * 0.02);
            }

            // 6. Host-Specific Pattern Boosts
            for (const hb of this.HOST_BOOSTS) {
                if (hb.hostPattern.test(c.host)) {
                    for (const pat of hb.urlPatterns) {
                        if (pat.test(c.url)) {
                            score += hb.boost;
                            break; // One boost per host rule
                        }
                    }
                    break; // One host match per candidate
                }
            }

            // Final normalization and rounding
            if (c.host === "") {
                c.finalScore = 0;
                c.certaintyTier = 'Malformed';
            } else {
                // Cap at 1.0 and round to 2 decimal places
                const rawScore = Math.min(1, score);
                c.finalScore = Math.round(rawScore * 100) / 100;
                
                // Assign human-readable forensic certainty tier
                if (c.finalScore >= 0.85) {
                    c.certaintyTier = 'High';
                } else if (c.finalScore >= 0.5) {
                    c.certaintyTier = 'Moderate';
                } else {
                    c.certaintyTier = 'Low';
                }
            }
            return c;
        });

        // Sort descending
        ranked.sort((a, b) => b.finalScore - a.finalScore);

        return {
            candidates: ranked,
            best: ranked[0] || null
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Ranker;
}
