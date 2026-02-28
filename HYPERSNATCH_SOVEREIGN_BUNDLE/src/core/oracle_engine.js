// ==================== SOVEREIGN ORACLE // HEURISTIC INTELLIGENCE ====================
"use strict";

const OracleEngine = {
  version: "1.0.0",
  
  // Knowledge Base: Patterns of interest for forensic investigators
  KnowledgeBase: [
    {
      id: "obfuscated_js",
      name: "Anti-Forensic Script",
      severity: "high",
      patterns: [/eval\(.*\)/, /String\.fromCharCode/, /base64/, /\_0x[a-f0-9]+/],
      insight: "Detected patterns common in script obfuscation and anti-debug maneuvers."
    },
    {
      id: "temporary_host",
      name: "Volatile File Host",
      severity: "medium",
      patterns: [/temp/, /anon/, /throwaway/, /tmp/],
      insight: "Artifact is hosted on a high-volatility platform. Evidence may be destroyed soon."
    },
    {
      id: "credential_leak",
      name: "Possible Credential Leak",
      severity: "critical",
      patterns: [/apikey/i, /secret/i, /token=/i, /auth=/i],
      insight: "Possible exposed credentials or session tokens detected in artifact metadata."
    },
    {
      id: "encrypted_payload",
      name: "Encrypted Archive",
      severity: "medium",
      patterns: [/\.7z$/, /\.rar$/, /\.zip$/, /\.tar\.gz$/],
      insight: "Compressed container detected. May require offline decryption for further analysis."
    }
  ],

  /**
   * Profiles a candidate and provides intelligence insights
   */
  profile(candidate) {
    const insights = [];
    const textToScan = [
      candidate.url || '',
      candidate.content || '',
      candidate.filename || '',
      candidate.host || ''
    ].join(' ');

    let maxSeverity = 'low';

    this.KnowledgeBase.forEach(rule => {
      const match = rule.patterns.some(pattern => pattern.test(textToScan));
      if (match) {
        insights.push({
          id: rule.id,
          name: rule.name,
          insight: rule.insight,
          severity: rule.severity
        });
        
        // Update max severity
        const severityMap = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };
        if (severityMap[rule.severity] > severityMap[maxSeverity]) {
          maxSeverity = rule.severity;
        }
      }
    });

    return {
      insights,
      intelligenceGrade: maxSeverity,
      analyzedAt: new Date().toISOString()
    };
  }
};

if (typeof window !== 'undefined') {
  window.OracleEngine = OracleEngine;
}

module.exports = OracleEngine;
