const fs = require('fs');
const path = require('path');

/**
 * CaseNotes.js
 * Manages analyst notes within a case.
 * Supports markdown and timestamping.
 */
const CaseNotes = {
    /**
     * Add a note to a case
     * @param {Object} caseData 
     * @param {string} content Markdown content
     * @returns {Object} Updated case object
     */
    addNote(caseData, content) {
        const note = {
            id: `note-${Date.now()}`,
            timestamp: Date.now(),
            content: content
        };
        caseData.notes.push(note);
        return caseData;
    },

    /**
     * Export notes to a markdown file
     * @param {Object} caseData 
     * @param {string} exportPath Full path to notes.md
     */
    exportToMarkdown(caseData, exportPath) {
        let md = `# Investigation Notes: ${caseData.title}\n`;
        md += `Case ID: ${caseData.case_id}\n\n`;

        caseData.notes.forEach(n => {
            const date = new Date(n.timestamp).toISOString();
            md += `## Entry [${date}]\n---\n${n.content}\n\n`;
        });

        fs.writeFileSync(exportPath, md, 'utf8');
    }
};

module.exports = CaseNotes;
