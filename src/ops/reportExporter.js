const fs = require("fs");
const path = require("path");

/**
 * HyperSnatch Operations: Report Exporter
 * Generates forensic investigation reports in JSON/Markdown.
 */

class ReportExporter {
    /**
     * exportReport(caseData, outputDir)
     * @param {Object} caseData - The case data from CaseManager
     * @param {string} outputDir - The directory to save the report
     */
    exportReport(caseData, outputDir) {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const reportId = `${caseData.id}_report_${Date.now()}`;

        // JSON Report
        const jsonPath = path.join(outputDir, `${reportId}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(caseData, null, 2));

        // Markdown Report
        const mdPath = path.join(outputDir, `${reportId}.md`);
        const mdContent = `
# Forensic Investigation Report: ${caseData.id}
**Status:** ${caseData.status}
**Generated:** ${new Date().toISOString()}

## Summary
Case created on: ${caseData.createdAt}

## Evidence Bundles
${caseData.bundles.map(b => `- [${b.path}] (Added: ${b.addedAt})`).join('\n')}

## Observations
${caseData.observations.map(o => `- ${o}`).join('\n')}

---
*HyperSnatch Phase 8 Institutional Forensic Platform*
        `;

        fs.writeFileSync(mdPath, mdContent);
        console.log(`[Exporter] Report generated: ${reportId}`);
        return { json: jsonPath, md: mdPath };
    }
}

module.exports = new ReportExporter();
