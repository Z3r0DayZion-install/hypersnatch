const fs = require('fs');
const path = require('path');

/**
 * DatasetExporter.js
 * Handles exporting forensic artifacts and relational data.
 */
class DatasetExporter {
    async exportCase(caseData, format, targetPath) {
        if (format === 'json') {
            fs.writeFileSync(targetPath, JSON.stringify(caseData, null, 2));
        } else if (format === 'csv') {
            const csv = this._convertToCSV(caseData);
            fs.writeFileSync(targetPath, csv);
        } else if (format === 'relational') {
            const relational = this._convertToRelational(caseData);
            fs.writeFileSync(targetPath, JSON.stringify(relational, null, 2));
        } else {
            throw new Error(`Unsupported export format: ${format}`);
        }
    }

    _convertToCSV(caseData) {
        const headers = ['bundle_path', 'cdn', 'protocol', 'player', 'fingerprint'];
        const rows = (caseData.bundles || []).map(b => [
            b.path,
            b.cdn || '',
            b.protocol || '',
            b.playerSignature || '',
            b.fingerprint_data ? b.fingerprint_data.hash : ''
        ].join(','));

        return [headers.join(','), ...rows].join('\n');
    }

    _convertToRelational(caseData) {
        // Export nodes and edges for external graph tools
        const nodes = [];
        const edges = [];

        (caseData.bundles || []).forEach(b => {
            nodes.push({ id: b.path, type: 'BUNDLE', label: b.path });
            if (b.cdn) {
                nodes.push({ id: b.cdn, type: 'CDN', label: b.cdn });
                edges.push({ from: b.path, to: b.cdn, relation: 'DELIVERED_BY' });
            }
            if (b.protocol) {
                nodes.push({ id: b.protocol, type: 'PROTOCOL', label: b.protocol });
                edges.push({ from: b.path, to: b.protocol, relation: 'PROTOCOL_USED' });
            }
        });

        return { nodes, edges };
    }
}

module.exports = DatasetExporter;
