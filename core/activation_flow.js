/**
 * Activation Flow
 * License import, validation, and activation management
 */

const ActivationFlow = {
  // Module metadata
  name: 'activation_flow',
  version: '1.0.0',
  description: 'License import, validation, and activation management',
  
  // State
  initialized: false,
  activationInProgress: false,
  
  /**
   * Initialize activation flow
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Set up activation UI
      this.setupActivationUI();
      
      // Check for existing license
      await this.checkExistingLicense();
      
      this.initialized = true;
      this.log('[ACTIVATION] Activation flow initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Activation flow initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Start license import flow
   */
  async startLicenseImport() {
    if (this.activationInProgress) {
      this.log('[ACTIVATION] License import already in progress');
      return;
    }
    
    try {
      this.activationInProgress = true;
      
      // Show file picker
      const file = await this.showLicenseFilePicker();
      
      if (file) {
        await this.importAndActivateLicense(file);
      }
      
    } catch (error) {
      this.log(`[ERROR] License import failed: ${error.message}`);
      this.showActivationError(error.message);
    } finally {
      this.activationInProgress = false;
    }
  },
  
  /**
   * Import and activate license
   */
  async importAndActivateLicense(file) {
    try {
      // Show progress
      this.showActivationProgress('Importing license...');
      
      // Read license file
      const licenseData = await this.readLicenseFile(file);
      
      // Parse license
      this.showActivationProgress('Parsing license...');
      const license = this.parseLicenseData(licenseData);
      
      // Validate license
      this.showActivationProgress('Validating license...');
      const validation = await this.validateLicense(license);
      
      if (!validation.valid) {
        throw new Error(`License validation failed: ${validation.reason}`);
      }
      
      // Confirm activation
      this.showActivationProgress('Confirming activation...');
      const confirmed = await this.confirmActivation(license);
      
      if (!confirmed) {
        throw new Error('Activation cancelled by user');
      }
      
      // Activate license
      this.showActivationProgress('Activating license...');
      await this.activateLicense(license);
      
      // Show success
      this.showActivationSuccess(license);
      
      this.log(`[ACTIVATION] License activated: ${license.edition}`);
      return license;
      
    } catch (error) {
      this.log(`[ERROR] License activation failed: ${error.message}`);
      this.showActivationError(error.message);
      throw error;
    }
  },
  
  /**
   * Deactivate current license
   */
  async deactivateLicense() {
    try {
      // Confirm deactivation
      const confirmed = await this.confirmDeactivation();
      
      if (!confirmed) {
        return;
      }
      
      // Show progress
      this.showActivationProgress('Deactivating license...');
      
      // Deactivate license
      await this.performDeactivation();
      
      // Show success
      this.showDeactivationSuccess();
      
      this.log('[ACTIVATION] License deactivated');
      return true;
      
    } catch (error) {
      this.log(`[ERROR] License deactivation failed: ${error.message}`);
      this.showActivationError(error.message);
      throw error;
    }
  },
  
  /**
   * Check for existing license
   */
  async checkExistingLicense() {
    try {
      if (window.LicenseSystem) {
        const license = window.LicenseSystem.getCurrentLicense();
        
        if (license.valid) {
          this.showExistingLicense(license.license);
        } else {
          this.showNoLicense();
        }
      }
    } catch (error) {
      this.log(`[ERROR] Failed to check existing license: ${error.message}`);
    }
  },
  
  /**
   * Setup activation UI
   */
  setupActivationUI() {
    // Create activation panel if not exists
    let activationPanel = document.getElementById('activation-panel');
    
    if (!activationPanel) {
      activationPanel = document.createElement('div');
      activationPanel.id = 'activation-panel';
      activationPanel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 20px;
        min-width: 400px;
        max-width: 600px;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        display: none;
      `;
      
      document.body.appendChild(activationPanel);
    }
    
    // Update activation panel content
    activationPanel.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: var(--accent); margin: 0;">HyperSnatch License Activation</h2>
      </div>
      
      <div id="activation-content">
        <!-- Content will be updated dynamically -->
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button id="activation-close" style="
          background: var(--muted);
          color: var(--fg);
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('activation-close').addEventListener('click', () => {
      this.hideActivationPanel();
    });
  },
  
  /**
   * Show activation panel
   */
  showActivationPanel() {
    const panel = document.getElementById('activation-panel');
    if (panel) {
      panel.style.display = 'block';
    }
  },
  
  /**
   * Hide activation panel
   */
  hideActivationPanel() {
    const panel = document.getElementById('activation-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  },
  
  /**
   * Show license file picker
   */
  async showLicenseFilePicker() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.tear,.json';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        resolve(file);
      };
      
      input.click();
    });
  },
  
  /**
   * Read license file
   */
  async readLicenseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read license file'));
      };
      
      reader.readAsText(file);
    });
  },
  
  /**
   * Parse license data
   */
  parseLicenseData(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to parse license data: ${error.message}`);
    }
  },
  
  /**
   * Validate license
   */
  async validateLicense(license) {
    if (window.LicenseSystem) {
      return await window.LicenseSystem.validateLicense(license);
    }
    
    // Fallback validation
    if (!license.edition || !license.signature) {
      return { valid: false, reason: 'Invalid license structure' };
    }
    
    return { valid: true };
  },
  
  /**
   * Confirm activation
   */
  async confirmActivation(license) {
    return new Promise((resolve) => {
      const content = document.getElementById('activation-content');
      
      content.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h3>Confirm License Activation</h3>
          <div style="background: var(--bg); padding: 15px; border-radius: 4px; margin: 10px 0;">
            <div><strong>Edition:</strong> ${license.edition}</div>
            <div><strong>Tier:</strong> ${license.tierLevel}</div>
            <div><strong>Issued to:</strong> ${license.issuedTo || 'Unknown'}</div>
            ${license.expiry ? `<div><strong>Expires:</strong> ${new Date(license.expiry).toLocaleDateString()}</div>` : ''}
            ${license.features ? `<div><strong>Features:</strong> ${license.features.join(', ')}</div>` : ''}
          </div>
        </div>
        
        <div style="text-align: center;">
          <button id="confirm-activation" style="
            background: var(--accent);
            color: var(--bg);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            margin-right: 10px;
          ">Activate License</button>
          
          <button id="cancel-activation" style="
            background: var(--muted);
            color: var(--fg);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `;
      
      document.getElementById('confirm-activation').addEventListener('click', () => {
        resolve(true);
      });
      
      document.getElementById('cancel-activation').addEventListener('click', () => {
        resolve(false);
      });
    });
  },
  
  /**
   * Confirm deactivation
   */
  async confirmDeactivation() {
    return new Promise((resolve) => {
      const content = document.getElementById('activation-content');
      
      content.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h3>Confirm License Deactivation</h3>
          <p>Are you sure you want to deactivate the current license? This will return HyperSnatch to Core edition.</p>
        </div>
        
        <div style="text-align: center;">
          <button id="confirm-deactivation" style="
            background: var(--err);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            margin-right: 10px;
          ">Deactivate</button>
          
          <button id="cancel-deactivation" style="
            background: var(--muted);
            color: var(--fg);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `;
      
      document.getElementById('confirm-deactivation').addEventListener('click', () => {
        resolve(true);
      });
      
      document.getElementById('cancel-deactivation').addEventListener('click', () => {
        resolve(false);
      });
    });
  },
  
  /**
   * Activate license
   */
  async activateLicense(license) {
    if (window.LicenseSystem) {
      await window.LicenseSystem.activateLicense(license);
    }
  },
  
  /**
   * Perform deactivation
   */
  async performDeactivation() {
    if (window.LicenseSystem) {
      await window.LicenseSystem.deactivateLicense();
    }
  },
  
  /**
   * Show activation progress
   */
  showActivationProgress(message) {
    const content = document.getElementById('activation-content');
    if (content) {
      content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 3px solid var(--accent);
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <div style="margin-top: 15px; color: var(--muted);">${message}</div>
        </div>
        
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
    }
  },
  
  /**
   * Show activation success
   */
  showActivationSuccess(license) {
    const content = document.getElementById('activation-content');
    if (content) {
      content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="
            display: inline-block;
            width: 60px;
            height: 60px;
            background: var(--success);
            border-radius: 50%;
            margin-bottom: 20px;
            line-height: 60px;
            font-size: 30px;
            color: white;
          ">✓</div>
          
          <h3 style="color: var(--success); margin-bottom: 15px;">License Activated Successfully!</h3>
          <div style="background: var(--bg); padding: 15px; border-radius: 4px;">
            <div><strong>Edition:</strong> ${license.edition}</div>
            <div><strong>Tier:</strong> ${license.tierLevel}</div>
            <div><strong>Issued to:</strong> ${license.issuedTo || 'Unknown'}</div>
          </div>
          
          <div style="margin-top: 20px;">
            <button onclick="ActivationFlow.hideActivationPanel()" style="
              background: var(--accent);
              color: var(--bg);
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 600;
            ">Close</button>
          </div>
        </div>
      `;
    }
  },
  
  /**
   * Show deactivation success
   */
  showDeactivationSuccess() {
    const content = document.getElementById('activation-content');
    if (content) {
      content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="
            display: inline-block;
            width: 60px;
            height: 60px;
            background: var(--warn);
            border-radius: 50%;
            margin-bottom: 20px;
            line-height: 60px;
            font-size: 30px;
            color: white;
          ">←</div>
          
          <h3 style="color: var(--warn); margin-bottom: 15px;">License Deactivated</h3>
          <p>HyperSnatch has returned to Core edition.</p>
          
          <div style="margin-top: 20px;">
            <button onclick="ActivationFlow.hideActivationPanel()" style="
              background: var(--accent);
              color: var(--bg);
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 600;
            ">Close</button>
          </div>
        </div>
      `;
    }
  },
  
  /**
   * Show activation error
   */
  showActivationError(message) {
    const content = document.getElementById('activation-content');
    if (content) {
      content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="
            display: inline-block;
            width: 60px;
            height: 60px;
            background: var(--err);
            border-radius: 50%;
            margin-bottom: 20px;
            line-height: 60px;
            font-size: 30px;
            color: white;
          ">✗</div>
          
          <h3 style="color: var(--err); margin-bottom: 15px;">Activation Failed</h3>
          <div style="background: #2a1a1a; padding: 15px; border-radius: 4px; color: var(--err);">
            ${message}
          </div>
          
          <div style="margin-top: 20px;">
            <button onclick="ActivationFlow.hideActivationPanel()" style="
              background: var(--accent);
              color: var(--bg);
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 600;
            ">Close</button>
          </div>
        </div>
      `;
    }
  },
  
  /**
   * Show existing license
   */
  showExistingLicense(license) {
    const content = document.getElementById('activation-content');
    if (content) {
      content.innerHTML = `
        <div style="padding: 20px;">
          <h3 style="color: var(--accent); margin-bottom: 15px;">Current License</h3>
          <div style="background: var(--bg); padding: 15px; border-radius: 4px;">
            <div><strong>Edition:</strong> ${license.edition}</div>
            <div><strong>Tier:</strong> ${license.tierLevel}</div>
            <div><strong>Issued to:</strong> ${license.issuedTo || 'Unknown'}</div>
            ${license.expiry ? `<div><strong>Expires:</strong> ${new Date(license.expiry).toLocaleDateString()}</div>` : ''}
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="ActivationFlow.startLicenseImport()" style="
              background: var(--muted);
              color: var(--fg);
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              margin-right: 10px;
            ">Import New License</button>
            
            <button onclick="ActivationFlow.deactivateLicense()" style="
              background: var(--err);
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
            ">Deactivate</button>
          </div>
        </div>
      `;
    }
  },
  
  /**
   * Show no license
   */
  showNoLicense() {
    const content = document.getElementById('activation-content');
    if (content) {
      content.innerHTML = `
        <div style="padding: 20px;">
          <h3 style="color: var(--muted); margin-bottom: 15px;">No License Active</h3>
          <p>HyperSnatch is running in Core edition. Import a license to unlock additional features.</p>
          
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="ActivationFlow.startLicenseImport()" style="
              background: var(--accent);
              color: var(--bg);
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 600;
            ">Import License</button>
          </div>
        </div>
      `;
    }
  },
  
  /**
   * Log activation flow events
   */
  log(message) {
    console.log(`[ACTIVATION_FLOW] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActivationFlow;
} else {
  window.ActivationFlow = ActivationFlow;
}
