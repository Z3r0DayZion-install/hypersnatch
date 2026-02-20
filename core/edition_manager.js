/**
 * Edition Manager
 * Multi-edition product platform with Core, Platform, and Enterprise tiers
 */

const EditionManager = {
  // Module metadata
  name: 'edition_manager',
  version: '1.0.0',
  description: 'Multi-edition product platform with tiered licensing',
  
  // State
  initialized: false,
  currentEdition: 'Core',
  currentTier: 1,
  licenseValid: false,
  licenseData: null,
  
  // Edition definitions
  editions: {
    Core: {
      name: 'HyperSnatch Core',
      description: 'Basic Link Resurrection Engine',
      tier: 1,
      capabilities: [
        'basic_html_ingest',
        'strict_policy_only',
        'simple_resurrection',
        'evidence_logging'
      ],
      features: [
        'html_input',
        'basic_extraction',
        'policy_enforcement',
        'export_txt'
      ],
      restrictions: {
        noHarAnalysis: true,
        noStrategyPacks: true,
        noWorkspaces: true,
        noEnterpriseFeatures: true,
        noLabMode: true,
        noDebugConsole: true
      },
      ui: {
        hideTabs: ['workspaces', 'strategy', 'reports'],
        hideControls: ['harInput', 'strategyPacks', 'workspaceManagement'],
        disableFeatures: ['advancedExport', 'customAnalysis']
      }
    },
    
    Platform: {
      name: 'HyperSnatch',
      description: 'Advanced Link Resurrection Platform',
      tier: 3,
      capabilities: [
        'html_har_ingest',
        'strategy_pack_loading',
        'workspace_isolation',
        'evidence_mode',
        'tier_gating',
        'release_mode'
      ],
      features: [
        'html_input',
        'har_input',
        'strategy_marketplace',
        'multi_workspace',
        'advanced_export',
        'case_reports',
        'lab_mode'
      ],
      restrictions: {
        noHarAnalysis: false,
        noStrategyPacks: false,
        noWorkspaces: false,
        noEnterpriseFeatures: true,
        noLabMode: false,
        noDebugConsole: false
      },
      ui: {
        hideTabs: [],
        hideControls: [],
        disableFeatures: ['enterpriseLock']
      }
    },
    
    Enterprise: {
      name: 'HyperSnatch Enterprise',
      description: 'Enterprise-Grade Forensic Platform',
      tier: 5,
      capabilities: [
        'enterprise_mode',
        'role_based_control',
        'immutable_logs',
        'case_report_export',
        'multi_workspace_isolation',
        'compliance_reporting',
        'api_access'
      ],
      features: [
        'all_features',
        'enterprise_lock',
        'role_management',
        'audit_trails',
        'compliance_tools',
        'advanced_security'
      ],
      restrictions: {
        noHarAnalysis: false,
        noStrategyPacks: false,
        noWorkspaces: false,
        noEnterpriseFeatures: false,
        noLabMode: true, // Lab mode disabled in Enterprise
        noDebugConsole: true
      },
      ui: {
        hideTabs: [],
        hideControls: ['labModeToggle'],
        disableFeatures: [],
        forceEnterprise: true
      }
    }
  },
  
  /**
   * Initialize edition manager
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load license if available
      await this.loadLicense();
      
      // Apply edition restrictions
      await this.applyEditionRestrictions();
      
      this.initialized = true;
      this.log('[EDITION] Edition manager initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Edition manager initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Get current edition
   */
  getCurrentEdition() {
    return {
      name: this.currentEdition,
      tier: this.currentTier,
      valid: this.licenseValid,
      licenseData: this.licenseData,
      capabilities: this.editions[this.currentEdition]?.capabilities || [],
      features: this.editions[this.currentEdition]?.features || []
    };
  },
  
  /**
   * Check if feature is available in current edition
   */
  hasFeature(feature) {
    const edition = this.editions[this.currentEdition];
    if (!edition) return false;
    
    return edition.features.includes(feature) || edition.features.includes('all_features');
  },
  
  /**
   * Check if capability is available in current edition
   */
  hasCapability(capability) {
    const edition = this.editions[this.currentEdition];
    if (!edition) return false;
    
    return edition.capabilities.includes(capability);
  },
  
  /**
   * Check if feature is restricted in current edition
   */
  isRestricted(feature) {
    const edition = this.editions[this.currentEdition];
    if (!edition) return true;
    
    return edition.restrictions[`no${feature.charAt(0).toUpperCase() + feature.slice(1)}`] === true;
  },
  
  /**
   * Activate edition with license
   */
  async activateEdition(licenseData) {
    try {
      // Validate license
      const validation = await this.validateLicense(licenseData);
      if (!validation.valid) {
        throw new Error(`License validation failed: ${validation.reason}`);
      }
      
      // Set edition and tier
      this.currentEdition = licenseData.edition;
      this.currentTier = licenseData.tierLevel || this.editions[licenseData.edition]?.tier || 1;
      this.licenseData = licenseData;
      this.licenseValid = true;
      
      // Apply edition restrictions
      await this.applyEditionRestrictions();
      
      // Log activation
      await this.logActivationEvent(licenseData);
      
      this.log(`[EDITION] Activated edition: ${this.currentEdition} (Tier ${this.currentTier})`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to activate edition: ${error.message}`);
      await this.fallbackToCore();
      throw error;
    }
  },
  
  /**
   * Deactivate license and return to Core
   */
  async deactivateLicense() {
    try {
      // Clear license data
      this.currentEdition = 'Core';
      this.currentTier = 1;
      this.licenseData = null;
      this.licenseValid = false;
      
      // Apply Core restrictions
      await this.applyEditionRestrictions();
      
      // Log deactivation
      await this.logDeactivationEvent();
      
      this.log('[EDITION] Deactivated license, returned to Core edition');
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to deactivate license: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Validate license
   */
  async validateLicense(licenseData) {
    try {
      // Check license structure
      if (!licenseData.edition || !licenseData.signature) {
        return { valid: false, reason: 'Invalid license structure' };
      }
      
      // Check edition exists
      if (!this.editions[licenseData.edition]) {
        return { valid: false, reason: 'Unknown edition' };
      }
      
      // Verify signature
      const signatureValid = await this.verifyLicenseSignature(licenseData);
      if (!signatureValid) {
        return { valid: false, reason: 'Invalid signature' };
      }
      
      // Check expiry
      if (licenseData.expiry) {
        const expiryDate = new Date(licenseData.expiry);
        if (expiryDate < new Date()) {
          return { valid: false, reason: 'License expired' };
        }
      }
      
      // Check features against edition
      if (licenseData.features) {
        const editionFeatures = this.editions[licenseData.edition].features;
        const hasInvalidFeatures = licenseData.features.some(feature => 
          !editionFeatures.includes(feature) && !editionFeatures.includes('all_features')
        );
        if (hasInvalidFeatures) {
          return { valid: false, reason: 'Invalid features for edition' };
        }
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  },
  
  /**
   * Apply edition restrictions to UI and features
   */
  async applyEditionRestrictions() {
    try {
      const edition = this.editions[this.currentEdition];
      if (!edition) return;
      
      // Hide tabs
      if (edition.ui.hideTabs) {
        this.hideTabs(edition.ui.hideTabs);
      }
      
      // Hide controls
      if (edition.ui.hideControls) {
        this.hideControls(edition.ui.hideControls);
      }
      
      // Disable features
      if (edition.ui.disableFeatures) {
        this.disableFeatures(edition.ui.disableFeatures);
      }
      
      // Apply restrictions
      Object.entries(edition.restrictions).forEach(([restriction, enabled]) => {
        if (enabled) {
          this.applyRestriction(restriction);
        }
      });
      
      // Force enterprise mode if required
      if (edition.ui.forceEnterprise) {
        await this.forceEnterpriseMode();
      }
      
      // Update UI indicators
      this.updateEditionIndicators();
      
      this.log(`[EDITION] Applied restrictions for ${this.currentEdition} edition`);
    } catch (error) {
      this.log(`[ERROR] Failed to apply edition restrictions: ${error.message}`);
    }
  },
  
  /**
   * Hide UI tabs
   */
  hideTabs(tabs) {
    tabs.forEach(tabName => {
      const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
      const tabContent = document.getElementById(`${tabName}-tab`);
      
      if (tabButton) {
        tabButton.style.display = 'none';
      }
      if (tabContent) {
        tabContent.style.display = 'none';
      }
    });
  },
  
  /**
   * Hide UI controls
   */
  hideControls(controls) {
    controls.forEach(controlId => {
      const control = document.getElementById(controlId);
      if (control) {
        control.style.display = 'none';
      }
    });
  },
  
  /**
   * Disable features
   */
  disableFeatures(features) {
    features.forEach(feature => {
      const elements = document.querySelectorAll(`[data-feature="${feature}"]`);
      elements.forEach(element => {
        element.disabled = true;
        element.title = `${feature} not available in ${this.currentEdition} edition`;
      });
    });
  },
  
  /**
   * Apply specific restriction
   */
  applyRestriction(restriction) {
    switch (restriction) {
      case 'noHarAnalysis':
        this.disableHarAnalysis();
        break;
      case 'noStrategyPacks':
        this.disableStrategyPacks();
        break;
      case 'noWorkspaces':
        this.disableWorkspaces();
        break;
      case 'noEnterpriseFeatures':
        this.disableEnterpriseFeatures();
        break;
      case 'noLabMode':
        this.disableLabMode();
        break;
      case 'noDebugConsole':
        this.disableDebugConsole();
        break;
    }
  },
  
  /**
   * Disable HAR analysis
   */
  disableHarAnalysis() {
    const harInput = document.getElementById('harInput');
    if (harInput) {
      harInput.disabled = true;
      harInput.title = 'HAR analysis not available in Core edition';
    }
  },
  
  /**
   * Disable strategy packs
   */
  disableStrategyPacks() {
    const strategyTab = document.querySelector('[data-tab="strategy"]');
    if (strategyTab) {
      strategyTab.style.display = 'none';
    }
  },
  
  /**
   * Disable workspaces
   */
  disableWorkspaces() {
    const workspaceTab = document.querySelector('[data-tab="workspaces"]');
    if (workspaceTab) {
      workspaceTab.style.display = 'none';
    }
  },
  
  /**
   * Disable enterprise features
   */
  disableEnterpriseFeatures() {
    const enterpriseControls = document.querySelectorAll('.enterprise-only');
    enterpriseControls.forEach(control => {
      control.style.display = 'none';
    });
  },
  
  /**
   * Disable lab mode
   */
  disableLabMode() {
    const labModeToggle = document.getElementById('labModeToggle');
    if (labModeToggle) {
      labModeToggle.disabled = true;
      labModeToggle.checked = false;
    }
  },
  
  /**
   * Disable debug console
   */
  disableDebugConsole() {
    const logBox = document.getElementById('logBox');
    if (logBox) {
      logBox.style.display = 'none';
    }
  },
  
  /**
   * Force enterprise mode
   */
  async forceEnterpriseMode() {
    if (window.EnterpriseManager) {
      await window.EnterpriseManager.enableEnterpriseMode();
    }
  },
  
  /**
   * Update edition indicators
   */
  updateEditionIndicators() {
    // Update edition badge
    const editionBadge = document.getElementById('editionBadge');
    if (editionBadge) {
      editionBadge.textContent = this.currentEdition;
      editionBadge.className = `edition-badge ${this.currentEdition.toLowerCase()}`;
    }
    
    // Update system info
    this.updateSystemInfo();
  },
  
  /**
   * Update system information
   */
  updateSystemInfo() {
    const systemInfo = document.getElementById('systemInfo');
    if (systemInfo) {
      const editionLine = `EDITION: ${this.currentEdition}`;
      const tierLine = `TIER: ${this.currentTier}`;
      const licenseLine = `LICENSE: ${this.licenseValid ? 'VALID' : 'CORE'}`;
      
      // Update or add edition information
      if (!systemInfo.innerHTML.includes('EDITION:')) {
        systemInfo.innerHTML += `<br>${editionLine}<br>${tierLine}<br>${licenseLine}`;
      } else {
        systemInfo.innerHTML = systemInfo.innerHTML.replace(
          /EDITION: [^<]*/,
          editionLine
        ).replace(
          /TIER: [^<]*/,
          tierLine
        ).replace(
          /LICENSE: [^<]*/,
          licenseLine
        );
      }
    }
  },
  
  /**
   * Load license from storage
   */
  async loadLicense() {
    try {
      // Try to load license file
      if (window.hyper && window.hyper.readFile) {
        const licenseData = await window.hyper.readFile('license.tear');
        if (licenseData) {
          const license = JSON.parse(licenseData);
          await this.activateEdition(license);
          return;
        }
      }
      
      // Fallback to Core edition
      await this.fallbackToCore();
    } catch (error) {
      this.log(`[WARNING] Failed to load license: ${error.message}`);
      await this.fallbackToCore();
    }
  },
  
  /**
   * Fallback to Core edition
   */
  async fallbackToCore() {
    this.currentEdition = 'Core';
    this.currentTier = 1;
    this.licenseValid = false;
    this.licenseData = null;
    
    await this.applyEditionRestrictions();
    
    this.log('[EDITION] Fallback to Core edition activated');
  },
  
  /**
   * Verify license signature
   */
  async verifyLicenseSignature(licenseData) {
    try {
      // In a real implementation, this would verify cryptographic signatures
      // For now, we'll simulate signature verification
      const signature = licenseData.signature;
      const payload = {
        edition: licenseData.edition,
        tierLevel: licenseData.tierLevel,
        issuedTo: licenseData.issuedTo,
        expiry: licenseData.expiry
      };
      
      // Simulate signature verification
      return signature && signature.length > 100;
    } catch (error) {
      this.log(`[ERROR] Signature verification failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Log activation event
   */
  async logActivationEvent(licenseData) {
    try {
      const event = {
        type: 'license_activation',
        timestamp: new Date().toISOString(),
        edition: licenseData.edition,
        tier: licenseData.tierLevel,
        issuedTo: licenseData.issuedTo,
        features: licenseData.features
      };
      
      if (window.EvidenceLogger) {
        await window.EvidenceLogger.addEvidenceLog(event);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to log activation event: ${error.message}`);
    }
  },
  
  /**
   * Log deactivation event
   */
  async logDeactivationEvent() {
    try {
      const event = {
        type: 'license_deactivation',
        timestamp: new Date().toISOString(),
        previousEdition: this.licenseData?.edition,
        previousTier: this.licenseData?.tierLevel
      };
      
      if (window.EvidenceLogger) {
        await window.EvidenceLogger.addEvidenceLog(event);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to log deactivation event: ${error.message}`);
    }
  },
  
  /**
   * Get upgrade options
   */
  getUpgradeOptions() {
    const currentEdition = this.editions[this.currentEdition];
    const upgrades = [];
    
    // Define upgrade paths
    const upgradePaths = {
      'Core': ['Platform', 'Enterprise'],
      'Platform': ['Enterprise']
    };
    
    const availableUpgrades = upgradePaths[this.currentEdition] || [];
    
    availableUpgrades.forEach(editionName => {
      const edition = this.editions[editionName];
      if (edition) {
        upgrades.push({
          from: this.currentEdition,
          to: editionName,
          name: edition.name,
          description: edition.description,
          tier: edition.tier,
          features: edition.features.filter(f => !currentEdition.features.includes(f)),
          capabilities: edition.capabilities.filter(c => !currentEdition.capabilities.includes(c))
        });
      }
    });
    
    return upgrades;
  },
  
  /**
   * Generate edition report
   */
  generateEditionReport() {
    return {
      currentEdition: this.getCurrentEdition(),
      availableEditions: Object.keys(this.editions).map(key => ({
        name: key,
        ...this.editions[key]
      })),
      upgradeOptions: this.getUpgradeOptions(),
      licenseStatus: {
        valid: this.licenseValid,
        data: this.licenseData,
        loadedAt: new Date().toISOString()
      }
    };
  },
  
  /**
   * Log edition manager events
   */
  log(message) {
    console.log(`[EDITION_MANAGER] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EditionManager;
} else {
  window.EditionManager = EditionManager;
}
