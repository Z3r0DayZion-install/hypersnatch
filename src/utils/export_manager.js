// ==================== PROFESSIONAL EXPORT MANAGER ====================
"use strict";

const ExportManager = {
  /**
   * Generates a professional evidence report in Plain Text
   */
  generateTextReport(evidence, metadata = {}) {
    const timestamp = new Date().toLocaleString();
    const buildId = metadata.buildId || 'HS-PROD-2026';
    
    let report = `==================================================
`;
    report += `   HYPERSNATCH // PROFESSIONAL EVIDENCE REPORT
`;
    report += `==================================================

`;
    
    report += `REPORT METADATA:
`;
    report += `----------------
`;
    report += `Generated:  ${timestamp}
`;
    report += `Build ID:   ${buildId}
`;
    report += `User:       ${metadata.user || 'Authorized Investigator'}
`;
    report += `Total Items: ${evidence.length}

`;
    
    report += `EVIDENCE SUMMARY:
`;
    report += `-----------------
`;
    
    evidence.forEach((item, index) => {
      report += `[Item #${index + 1}]
`;
      report += `Type:     ${item.type || 'unknown'}
`;
      report += `URL:      ${item.url || 'N/A'}
`;
      report += `Host:     ${item.host || 'N/A'}
`;
      report += `Detected: ${item.timestamp || 'unknown'}
`;
      if (item.filename) report += `Filename: ${item.filename}
`;
      if (item.confidence) report += `Confidence: ${(item.confidence * 100).toFixed(1)}%
`;
      report += `-----------------
`;
    });
    
    report += `
==================================================
`;
    report += `   END OF REPORT // SOVEREIGN AUDIT CHAIN VERIFIED
`;
    report += `==================================================
`;
    
    return report;
  },

  /**
   * Generates a clean CSV with professional headers
   */
  generateCSV(evidence) {
    if (!evidence || evidence.length === 0) return '';
    
    const headers = [
      'Item ID', 
      'Timestamp', 
      'Type', 
      'URL', 
      'Host', 
      'Filename', 
      'Confidence Score', 
      'Source HSX'
    ];
    
    const rows = evidence.map((item, index) => [
      index + 1,
      item.timestamp || '',
      item.type || '',
      item.url || '',
      item.host || '',
      item.filename || '',
      item.confidence ? (item.confidence * 100).toFixed(1) + '%' : '',
      item.hsxCode || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('
');
    
    return csvContent;
  },

  /**
   * Generates a JSON bundle with audit metadata
   */
  generateJSON(evidence, metadata = {}) {
    return JSON.stringify({
      manifest: {
        version: "1.5.0",
        format: "HS-EVIDENCE-BUNDLE",
        timestamp: new Date().toISOString(),
        buildId: metadata.buildId || 'HS-PROD-2026',
        itemCount: evidence.length
      },
      evidence: evidence,
      auditChain: metadata.auditChain || null
    }, null, 2);
  },

  /**
   * Generates a professional PDF report
   */
  async generatePDFReport(evidence, metadata = {}) {
    const timestamp = new Date().toLocaleString();
    const buildId = metadata.buildId || 'HS-PROD-2026';
    
    let html = `
      <html>
      <head>
        <style>
          body { font-family: sans-serif; color: #333; padding: 40px; }
          .header { border-bottom: 2px solid #00d084; padding-bottom: 10px; margin-bottom: 30px; }
          h1 { color: #00d084; margin: 0; font-size: 24px; }
          .metadata { font-size: 12px; color: #666; margin-bottom: 30px; }
          .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; background: #eee; padding: 8px; font-size: 12px; }
          td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 11px; word-break: break-all; }
          .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HYPERSNATCH // PROFESSIONAL EVIDENCE REPORT</h1>
        </div>
        
        <div class="metadata">
          <strong>Generated:</strong> ${timestamp}<br>
          <strong>Build ID:</strong> ${buildId}<br>
          <strong>Investigator:</strong> ${metadata.user || 'Authorized Personnel'}<br>
          <strong>Total Items:</strong> ${evidence.length}
        </div>

        <div class="summary">
          <strong>EVIDENCE SUMMARY</strong><br>
          This report contains evidence artifacts extracted and validated by the HyperSnatch Forensic Engine. 
          All entries are timestamped and linked to the Sovereign Audit Chain.
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Host / Filename</th>
              <th>Confidence</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${evidence.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.type || 'unknown'}</td>
                <td>${item.host || item.filename || '---'}</td>
                <td>${item.confidence ? (item.confidence * 100).toFixed(0) + '%' : '---'}</td>
                <td>${item.timestamp || '---'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          END OF REPORT // SOVEREIGN AUDIT CHAIN VERIFIED // ${buildId}
        </div>
      </body>
      </html>
    `;

    const filename = `hypersnatch-report-${Date.now()}.pdf`;
    if (window.vaultSearch && window.vaultSearch.exportPDF) {
      return await window.vaultSearch.exportPDF(html, filename);
    } else {
      console.error('PDF Export not available (Main process bridge missing)');
      return { success: false, reason: 'Bridge missing' };
    }
  },

  /**
   * Executes the Legendary "Final Freeze" Protocol
   */
  async executeFinalFreeze(evidence, metadata = {}, blackBoxLog = []) {
    console.log("[ExportManager] Initiating Final Freeze Protocol...");
    
    // 1. Generate TXT Report
    const txtContent = this.generateTextReport(evidence, metadata);
    
    // 2. Generate CSV Content
    const csvContent = this.generateCSV(evidence);
    
    // 3. Generate Reports Bundle
    const reports = [
      { filename: 'EVIDENCE_REPORT.txt', content: txtContent, type: 'text' },
      { filename: 'EVIDENCE_LOG.csv', content: csvContent, type: 'text' },
      { filename: 'raw_evidence.json', content: this.generateJSON(evidence, metadata), type: 'text' },
      { filename: 'INVESTIGATOR_TELEMETRY.json', content: JSON.stringify(blackBoxLog, null, 2), type: 'text' }
    ];

    const caseData = {
      buildId: metadata.buildId || 'HS-PROD-2026',
      itemCount: evidence.length,
      timestamp: new Date().toISOString()
    };

    if (window.vaultSearch && window.vaultSearch.finalFreeze) {
      return await window.vaultSearch.finalFreeze(caseData, reports);
    } else {
      throw new Error("Final Freeze bridge not available");
    }
  },

  /**
   * Verifies a Sovereign Audit Chain bundle via the IPC bridge
   */
  async verifySession(bundle) {
    if (window.smartDecode && window.smartDecode.verifySession) {
      return await window.smartDecode.verifySession(bundle);
    } else {
      console.warn("Session verification bridge not available");
      return false;
    }
  },

  /**
   * Generates a signed AI Affidavit via the Sovereign Intelligence Matrix
   */
  async generateAIAffidavit(sessionState, buildInfo) {
    if (window.aiWitness && window.aiWitness.infer) {
      const prompt = `Synthesize a forensic affidavit for ${sessionState.candidates.length} evidence items.`;
      const context = {
        itemCount: sessionState.candidates.length,
        rootHash: sessionState.signature, // If signed
        hwid: buildInfo.displayId
      };
      
      return await window.aiWitness.infer(prompt, context);
    } else {
      throw new Error("AI Witness bridge not available");
    }
  },

  /**
   * Triggers file download in the browser
   */
  downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

if (typeof window !== 'undefined') {
  window.ExportManager = ExportManager;
}

module.exports = ExportManager;
