const fs = require('fs');
const path = require('path');

class ReportGenerator {
    /**
     * Generates a forensic `report.md` based on the engine's finalResult output.
     * @param {Object} finalResult Output of engine_core.process
     * @returns {string} Markdown document
     */
    static generateMarkdown(finalResult) {
        if (!finalResult) return "# Error: No results provided.";

        const metadata = finalResult.metadata || {};
        const fingerprint = finalResult.fingerprint || {};
        const harStats = finalResult.harStats || {};
        const candidates = finalResult.candidates || [];
        const policy = finalResult.policy || { valid: true, violations: [] };

        const timestamp = metadata.processedAt || new Date().toISOString();
        const sessionId = metadata.sessionId || "Offline-Analysis";
        const engineVersion = metadata.engineVersion || "UNKNOWN";
        const processingTime = metadata.processingTime || "N/A";

        const playerStr = typeof fingerprint === 'string'
            ? fingerprint
            : (fingerprint.integrator || fingerprint.player || "Unknown");

        const confidenceStr = fingerprint.confidence
            ? `(Confidence: ${(fingerprint.confidence * 100).toFixed(1)}%)`
            : "";

        let md = `# HyperSnatch Forensic Analysis Report\n`;
        md += `\n**Session ID:** \`${sessionId}\`\n`;
        md += `**Processed At:** \`${timestamp}\`\n`;
        md += `**Engine Version:** \`${engineVersion}\`\n`;
        md += `**Processing Time:** \`${processingTime}ms\`\n`;

        md += `\n---\n`;

        // Policy & Refusals
        md += `\n## Execution Status\n`;
        if (finalResult.exportControl && !finalResult.exportControl.canExport) {
            md += `> [!WARNING] \n`;
            md += `> Extraction Refused: ${finalResult.exportControl.refusalReason || "Policy Violation"}\n\n`;
        } else if (!policy.valid) {
            md += `> [!WARNING] \n`;
            md += `> Policy Violations Detected: \n`;
            policy.violations.forEach(v => md += `> - ${v.rule}: ${v.reason}\n`);
            md += `\n`;
        } else {
            md += `> [!SUCCESS] \n`;
            md += `> Policy Clear. Pipeline Executed Successfully.\n\n`;
        }

        // Architecture Intelligence
        md += `\n## Architecture Intelligence\n\n`;
        md += `### Player Fingerprint\n`;
        md += `- **Detected Integrator:** \`${playerStr}\` ${confidenceStr}\n\n`;

        md += `### Network Footprint (HAR Stats)\n`;
        md += `- **Manifests Identified:** \`${harStats.manifests || 0}\`\n`;
        md += `- **Media Segments Scanned:** \`${harStats.segments || 0}\`\n`;
        md += `- **DRM Keys Detected:** \`${harStats.drmHits || 0}\`\n\n`;

        // Stream Candidates
        md += `\n## Stream Candidates\n\n`;
        md += `Total Candidates: **${candidates.length}**\n\n`;

        if (candidates.length === 0) {
            md += `*No viable streams isolated during extraction.*\n`;
        } else {
            md += `| Rank | Score | Type | URL | Certainty |\n`;
            md += `| --- | --- | --- | --- | --- |\n`;
            candidates.slice(0, 10).forEach((c, idx) => {
                const urlStr = c.url.length > 60 ? `${c.url.substring(0, 57)}...` : c.url;
                const certainty = c.certaintyTier || "Unknown";
                md += `| #${idx} | **${c.finalScore || 0}** | \`${c.type || 'unknown'}\` | \`${urlStr}\` | ${certainty} |\n`;
            });
            if (candidates.length > 10) md += `*...and ${candidates.length - 10} more.*\n`;
        }

        // --- PHASE 5: Stream Forensics Intelligence ---
        // Dynamically injected if invoked by engine_core.js
        if (finalResult.timelineCount !== undefined) {
            md += `\n## Stream Forensics Intelligence (Phase 5)\n\n`;
            md += `- **Timeline Events:** \`${finalResult.timelineCount}\` indexed segments\n`;
            md += `- **Discovered Bitrate Tiers:** \`${finalResult.streamsDetected}\` adaptive ladders extracted\n`;
            md += `- **Routing Waterfall Clusters:** \`${finalResult.waterfallClusters}\` contiguous delivery chunks\n`;
            md += `- **Edge Infrastructure:** \`${finalResult.cdnOrigin}\` detected\n`;
            md += `- **Token/DRM Protection:** \`${finalResult.securityProfile}\` signatures intercepted\n`;
        }

        // Scoring Logic Deep Dive (Top Candidate)
        if (candidates.length > 0) {
            const best = candidates[0];
            md += `\n### Top Candidate Breakdown\n`;
            md += `- **URL:** \`${best.url}\`\n`;
            md += `- **Score:** \`${best.finalScore || 0}\`\n`;
            if (best.scoreBreakdown && best.scoreBreakdown.length > 0) {
                md += `- **Rule Applicability:**\n`;
                best.scoreBreakdown.forEach(rule => {
                    if (rule.adjustment !== undefined && rule.reason) {
                        md += `  - [${rule.adjustment > 0 ? '+' : ''}${rule.adjustment}] ${rule.reason}\n`;
                    }
                });
            }
        }

        md += `\n---\n*Report generated deterministically by HyperSnatch Core Engine.*\n`;

        return md;
    }

    /**
     * Helper exposed explicitly for engine_core.js phase 5 integration
     */
    static generateReport(evidenceDirPath, reportData) {
        const md = this.generateMarkdown(reportData);
        fs.writeFileSync(path.join(evidenceDirPath, 'report.md'), md);
    }
}

module.exports = { ReportGenerator, generateReport: ReportGenerator.generateReport.bind(ReportGenerator) };
