// ==================== VERIFY PANEL ====================
"use strict";

const { validateWithErrors, getSchemaType, SchemaType } = require('./schema_validator.js');

const VERIFIER_KEY_JWK = {
  "key_ops": ["verify"], "ext": true, "kty": "EC", "x": "rxZlp3Qrm2nXSn4qLFpxm5KLwUV0UkO4rI2-dFq7Jew", "y": "r1rOT7qTYFy5CxxCu3Y5iiakwqQtqdzav_TWXAOfjQk", "crv": "P-256"
};

const VerifyPanel = {
  currentPack: null,
  currentValidation: null,
  
  render() {
    if (!this.currentPack) return;
    const type = getSchemaType(this.currentPack);
    const html = this.buildPanelHTML(type, this.currentValidation, this.currentPack);
    const container = document.getElementById("verifyStatus");
    if (container) {
      container.innerHTML = html;
    }
    
    if (this.currentPack.signature) {
      this.asyncVerify(this.currentPack);
    }
  },

  async asyncVerify(pack) {
    const el = document.getElementById("trustStatusBadge");
    if (!el) return;
    
    try {
      const ok = await this.verifyPackSignature(pack);
      if (ok) {
        el.innerHTML = '<span class="chip ok">✅ SOVEREIGN TRUST VERIFIED</span>';
      } else {
        el.innerHTML = '<span class="chip err">❌ SIGNATURE MISMATCH</span>';
      }
    } catch (err) {
      el.innerHTML = '<span class="chip err">❌ TRUST ERROR: ' + err.message + '</span>';
    }
  },

  async verifyPackSignature(pack) {
    if (!pack.signature || !pack.signature.sig) return false;
    try {
      const publicKey = await crypto.subtle.importKey("jwk", VERIFIER_KEY_JWK, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
      
      // Canonical logic: [format, schemaVersion, kind, kdf, iterations, salt, iv, digest, data].join("|")
      const text = [
        pack.format,
        pack.schemaVersion,
        pack.kind,
        pack.kdf,
        pack.iterations,
        pack.salt,
        pack.iv,
        pack.digest,
        pack.data
      ].join("|");
        
      const sig = Uint8Array.from(atob(pack.signature.sig), c => c.charCodeAt(0));
      return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, sig, new TextEncoder().encode(text));
    } catch (e) {
      console.error("verifyPackSignature error:", e);
      return false;
    }
  },

  buildPanelHTML(type, validation, pack) {
    const statusClass = validation.valid ? 'ok' : 'err';
    const statusText = validation.valid ? 'VALID' : 'INVALID';
    
    let html = `
      <div class="verify-panel">
        <div class="verify-header">
          <h3>🔍 Deep Inspection - ${type.toUpperCase()}</h3>
          <div class="status-badge ${statusClass}">${statusText}</div>
        </div>
        
        <div class="verify-content">
          <div class="verify-section">
            <h4>📋 Schema Information</h4>
            <div class="schema-info">
              <div><strong>Format:</strong> ${pack.format || 'Unknown'}</div>
              <div><strong>Schema Version:</strong> ${pack.schemaVersion || 'Unknown'}</div>
              <div><strong>App:</strong> ${pack.app || 'Unknown'}</div>
              <div><strong>App Version:</strong> ${pack.appVersion || 'Unknown'}</div>
    `;
    
    // Add kind for data packs
    if (pack.kind) {
      html += `              <div><strong>Kind:</strong> ${pack.kind}</div>`;
    }
    
    // Add manifest for bundles
    if (pack.manifest) {
      html += `
              <div><strong>Manifest:</strong></div>
              <div class="manifest-details">
                <div><strong>Name:</strong> ${pack.manifest.name || 'N/A'}</div>
                <div><strong>Description:</strong> ${pack.manifest.description || 'N/A'}</div>
                <div><strong>Version:</strong> ${pack.manifest.version || 'N/A'}</div>
              </div>`;
    }
    
    html += `
            </div>
          </div>
          
          <div class="verify-section">
            <h4>🔐 Integrity Verification</h4>
            <div class="integrity-info">
              <div><strong>Digest:</strong> <code class="digest">${pack.digest || 'N/A'}</code></div>
              <div id="trustStatusBadge"><strong>Trust Status:</strong> ${this.getTrustStatus(pack)}</div>
              <div><strong>Created:</strong> ${pack.createdAt || 'N/A'}</div>
    `;
    
    // Add expiration if present
    if (pack.expiresAt) {
      const expired = new Date(pack.expiresAt) < new Date();
      const expiredClass = expired ? 'err' : 'ok';
      html += `              <div><strong>Expires:</strong> <span class="${expiredClass}">${pack.expiresAt}</span></div>`;
    }
    
    html += `
            </div>
          </div>
          
          <div class="verify-section">
            <h4>⚠️ Validation Results</h4>
            <div class="validation-results">
    `;
    
    // Add validation errors if any
    if (validation.errors && validation.errors.length > 0) {
      html += `
                <div class="validation-errors">
                  <div class="error-title">❌ Validation Errors:</div>
                  <ul class="error-list">
      `;
      
      for (const error of validation.errors) {
        html += `                    <li><strong>${error.field}:</strong> ${error.message}</li>`;
      }
      
      html += `
                  </ul>
                </div>`;
    } else {
      html += `
                <div class="validation-success">
                  <div class="success-title">✅ Validation Passed</div>
                  <div>All schema requirements satisfied</div>
                </div>`;
    }
    
    html += `
            </div>
          </div>
    `;
    
    // Add contained objects for data packs
    if (pack.format === 'tear-v2' && pack.data) {
      html += `
          <div class="verify-section">
            <h4>📦 Contained Objects</h4>
            <div class="contained-objects">
              <div class="object-count">Data pack contains encrypted payload</div>
              <div class="encryption-info">
                <div><strong>Encryption:</strong> ${pack.salt ? 'Encrypted' : 'Unencrypted'}</div>
                <div><strong>KDF:</strong> ${pack.kdf || 'N/A'}</div>
                <div><strong>Iterations:</strong> ${pack.iterations || 'N/A'}</div>
              </div>
            </div>
          </div>`;
    }
    
    // Add assets for bundles
    if (pack.format === 'hs-tear-bundle-1' && pack.assets) {
      html += `
          <div class="verify-section">
            <h4>📦 Bundle Assets</h4>
            <div class="bundle-assets">
              <div class="asset-count">${pack.assets.length} assets</div>
              <div class="asset-list">
      `;
      
      for (const asset of pack.assets) {
        html += `
                <div class="asset-item">
                  <div><strong>Name:</strong> ${asset.name}</div>
                  <div><strong>Type:</strong> ${asset.type}</div>
                  <div><strong>Path:</strong> ${asset.path}</div>
                  <div><strong>Size:</strong> ${asset.size ? `${asset.size} bytes` : 'N/A'}</div>
                  <div><strong>Digest:</strong> <code class="digest">${asset.digest || 'N/A'}</code></div>
                </div>`;
      }
      
      html += `
              </div>
            </div>
          </div>`;
    }
    
    // Add action buttons
    html += `
          <div class="verify-actions">
            <button onclick="VerifyPanel.exportDoctorReport()" class="btn primary">📋 Export Doctor Report</button>
            <button onclick="VerifyPanel.copyDigest()" class="btn secondary">📋 Copy Digest</button>
          </div>
        </div>
      </div>
    `;
    
    return html;
  },
  
  getTrustStatus(pack) {
    if (!pack.signature) {
      return '<span class="chip warn">🔓 UNSIGNED</span>';
    }
    return '<span class="chip warn">⏳ VERIFYING...</span>';
  },
  
  loadPack(fileContent) {
    try {
      this.currentPack = JSON.parse(fileContent);
      this.currentValidation = validateWithErrors(this.currentPack);
      return true;
    } catch (error) {
      console.error('Failed to load pack:', error.message);
      this.currentPack = null;
      this.currentValidation = { valid: false, errors: [{ field: 'parse', message: error.message }] };
      return false;
    }
  },
  
  exportDoctorReport() {
    if (!this.currentPack) {
      alert('No pack loaded for doctor report');
      return;
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      pack: this.currentPack,
      validation: this.currentValidation,
      recommendations: this.generateRecommendations()
    };
    
    const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(reportBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `hypersnatch-doctor-report-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  },
  
  copyDigest() {
    if (!this.currentPack || !this.currentPack.digest) {
      alert('No digest available to copy');
      return;
    }
    
    navigator.clipboard.writeText(this.currentPack.digest);
    alert('Digest copied to clipboard');
  },
  
  generateRecommendations() {
    const recommendations = [];
    
    if (!this.currentValidation.valid) {
      recommendations.push('Fix validation errors before using this pack');
    }
    
    if (this.currentPack.format === 'tear-v2' && !this.currentPack.salt) {
      recommendations.push('Consider encrypting sensitive data packs');
    }
    
    if (this.currentPack.format === 'hs-tear-bundle-1' && (!this.currentPack.assets || this.currentPack.assets.length === 0)) {
      recommendations.push('Bundle should contain at least one asset');
    }
    
    if (!this.currentPack.signature) {
      recommendations.push('Consider signing release packs for trust verification');
    }
    
    return recommendations;
  }
};

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.VerifyPanel = VerifyPanel;
}

module.exports = VerifyPanel;
