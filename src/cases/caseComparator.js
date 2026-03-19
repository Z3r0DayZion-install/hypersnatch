const fs = require('fs');

/**
 * CaseComparator.js
 * Compares two forensic bundles to identify differences in infrastructure or behavior.
 */
const CaseComparator = {
    /**
     * Compare two .hyper bundles
     * @param {string} bundlePathA 
     * @param {string} bundlePathB 
     * @returns {Object} Comparison report data
     */
    compare(bundlePathA, bundlePathB) {
        const a = JSON.parse(fs.readFileSync(bundlePathA, 'utf8'));
        const b = JSON.parse(fs.readFileSync(bundlePathB, 'utf8'));

        const report = {
            timestamp: Date.now(),
            bundleA: { path: bundlePathA, fingerprint: a.fingerprint, host: a.host || "unknown" },
            bundleB: { path: bundlePathB, fingerprint: b.fingerprint, host: b.host || "unknown" },
            deltas: {}
        };

        // 1. Player Profile Comparison
        report.deltas.playerProfile = {
            match: a.playerName === b.playerName,
            a: a.playerName || "none",
            b: b.playerName || "none"
        };

        // 2. CDN Provider Comparison
        report.deltas.cdn = {
            match: a.cdnProvider === b.cdnProvider,
            a: a.cdnProvider || "unknown",
            b: b.cdnProvider || "unknown"
        };

        // 3. Stream Ladder Comparison
        const ladderA = a.streamLadder ? a.streamLadder.map(l => l.resolution).sort().join(',') : "";
        const ladderB = b.streamLadder ? b.streamLadder.map(l => l.resolution).sort().join(',') : "";
        report.deltas.streamLadder = {
            match: ladderA === ladderB,
            a: ladderA || "none",
            b: ladderB || "none"
        };

        // 4. Token Structure Logic (Heuristic)
        const hasTokenA = a.url && (a.url.includes('token') || a.url.includes('sig'));
        const hasTokenB = b.url && (b.url.includes('token') || b.url.includes('sig'));
        report.deltas.tokenized = {
            match: hasTokenA === hasTokenB,
            a: hasTokenA,
            b: hasTokenB
        };

        return report;
    },

    /**
     * Generate a markdown report from comparison data
     * @param {Object} reportData 
     * @returns {string} Markdown string
     */
    generateMarkdown(reportData) {
        let md = `# Forensic Comparison Report\n`;
        md += `Generated: ${new Date(reportData.timestamp).toISOString()}\n\n`;

        md += `| Feature | Bundle A (${reportData.bundleA.host}) | Bundle B (${reportData.bundleB.host}) | Match |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;

        const d = reportData.deltas;
        md += `| Player Profile | ${d.playerProfile.a} | ${d.playerProfile.b} | ${d.playerProfile.match ? "✅" : "❌"} |\n`;
        md += `| CDN Provider | ${d.cdn.a} | ${d.cdn.b} | ${d.cdn.match ? "✅" : "❌"} |\n`;
        md += `| Stream Ladder | ${d.streamLadder.a} | ${d.streamLadder.b} | ${d.streamLadder.match ? "✅" : "❌"} |\n`;
        md += `| Tokenized | ${d.tokenized.a} | ${d.tokenized.b} | ${d.tokenized.match ? "✅" : "❌"} |\n`;

        return md;
    }
};

module.exports = CaseComparator;
