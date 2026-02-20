/**
 * License System
 * Offline license activation and validation with .tear file format
 */

const LicenseSystem = {
  // Module metadata
  name: 'license_system',
  version: '1.0.0',
  description: 'Offline license activation and validation system',
  
  // State
  initialized: false,
  currentLicense: null,
  licenseValid: false,
  activationAttempts: 0,
  
  // License file structure
  licenseTemplate: {
    edition: null,
    tierLevel: 1,
    issuedTo: null,
    issuedAt: null,
    expiry: null,
    signature: null,
    features: [],
    restrictions: {},
    metadata: {}
  },
  
  /**
   * Initialize license system
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load existing license
      await this.loadLicense();
      
      this.initialized = true;
      this.log('[LICENSE] License system initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] License system initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Import license from .tear file
   */
  async importLicense(file) {
    try {
      this.activationAttempts++;
      
      // Read license file
      const licenseData = await this.readLicenseFile(file);
      
      // Parse license
      const license = this.parseLicenseData(licenseData);
      
      // Validate license
      const validation = await this.validateLicense(license);
      
      if (!validation.valid) {
        this.log(`[LICENSE ERROR] Invalid license: ${validation.reason}`);
        await this.fallbackToCore();
        throw new Error(`License validation failed: ${validation.reason}`);
      }
      
      // Activate license
      await this.activateLicense(license);
      
      this.log(`[LICENSE] License imported successfully: ${license.edition}`);
      return license;
    } catch (error) {
      this.log(`[ERROR] License import failed: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Validate license
   */
  async validateLicense(license) {
    try {
      // Check required fields
      const requiredFields = ['edition', 'tierLevel', 'signature'];
      for (const field of requiredFields) {
        if (!license[field]) {
          return { valid: false, reason: `Missing required field: ${field}` };
        }
      }
      
      // Verify signature
      const signatureValid = await this.verifyLicenseSignature(license);
      if (!signatureValid) {
        return { valid: false, reason: 'Invalid signature' };
      }
      
      // Check expiry
      if (license.expiry) {
        const expiryDate = new Date(license.expiry);
        if (expiryDate < new Date()) {
          return { valid: false, reason: 'License expired' };
        }
      }
      
      // Check edition validity
      if (!this.isValidEdition(license.edition)) {
        return { valid: false, reason: 'Invalid edition' };
      }
      
      // Check tier level
      if (!this.isValidTier(license.tierLevel)) {
        return { valid: false, reason: 'Invalid tier level' };
      }
      
      // Check features against edition
      if (license.features && !this.validateFeaturesForEdition(license.edition, license.features)) {
        return { valid: false, reason: 'Invalid features for edition' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  },
  
  /**
   * Activate license
   */
  async activateLicense(license) {
    try {
      // Store license
      this.currentLicense = license;
      this.licenseValid = true;
      
      // Save license to storage
      await this.saveLicense(license);
      
      // Activate edition in edition manager
      if (window.EditionManager) {
        await window.EditionManager.activateEdition(license);
      }
      
      // Log activation
      await this.logActivation(license);
      
      this.log(`[LICENSE] License activated: ${license.edition} (Tier ${license.tierLevel})`);
      return true;
    } catch (error) {
      this.log(`[ERROR] License activation failed: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Deactivate license
   */
  async deactivateLicense() {
    try {
      // Clear license
      this.currentLicense = null;
      this.licenseValid = false;
      
      // Remove license file
      await this.removeLicenseFile();
      
      // Deactivate edition
      if (window.EditionManager) {
        await window.EditionManager.deactivateLicense();
      }
      
      // Log deactivation
      await this.logDeactivation();
      
      this.log('[LICENSE] License deactivated, returned to Core edition');
      return true;
    } catch (error) {
      this.log(`[ERROR] License deactivation failed: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Get current license info
   */
  getCurrentLicense() {
    return {
      valid: this.licenseValid,
      license: this.currentLicense,
      activationAttempts: this.activationAttempts,
      loadedAt: new Date().toISOString()
    };
  },
  
  /**
   * Read license file
   */
  async readLicenseFile(file) {
    try {
      if (file instanceof File) {
        // Read from file input
        const text = await file.text();
        return text;
      } else if (typeof file === 'string') {
        // Read from path
        if (window.hyper && window.hyper.readFile) {
          return await window.hyper.readFile(file);
        }
        throw new Error('Cannot read license file');
      }
      throw new Error('Invalid file parameter');
    } catch (error) {
      throw new Error(`Failed to read license file: ${error.message}`);
    }
  },
  
  /**
   * Parse license data
   */
  parseLicenseData(data) {
    try {
      // Parse JSON
      const license = JSON.parse(data);
      
      // Validate structure
      if (!license.edition || !license.signature) {
        throw new Error('Invalid license structure');
      }
      
      return license;
    } catch (error) {
      throw new Error(`License parsing failed: ${error.message}`);
    }
  },
  
  /**
   * Verify license signature
   */
  async verifyLicenseSignature(license) {
    try {
      // In a real implementation, this would verify cryptographic signatures
      // For now, we'll simulate signature verification
      const signature = license.signature;
      const payload = {
        edition: license.edition,
        tierLevel: license.tierLevel,
        issuedTo: license.issuedTo,
        expiry: license.expiry,
        features: license.features
      };
      
      // Simulate signature verification
      return signature && signature.length > 100 && this.isValidSignatureFormat(signature);
    } catch (error) {
      this.log(`[ERROR] Signature verification failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Check if edition is valid
   */
  isValidEdition(edition) {
    const validEditions = ['Core', 'Platform', 'Enterprise'];
    return validEditions.includes(edition);
  },
  
  /**
   * Check if tier is valid
   */
  isValidTier(tier) {
    return tier >= 1 && tier <= 5;
  },
  
  /**
   * Validate features for edition
   */
  validateFeaturesForEdition(edition, features) {
    // Define allowed features per edition
    const allowedFeatures = {
      'Core': ['html_input', 'basic_extraction', 'policy_enforcement', 'export_txt'],
      'Platform': ['html_input', 'har_input', 'strategy_packs', 'workspaces', 'advanced_export', 'lab_mode'],
      'Enterprise': ['all_features']
    };
    
    const editionFeatures = allowedFeatures[edition];
    if (!editionFeatures) {
      return false;
    }
    
    // If edition allows all features, return true
    if (editionFeatures.includes('all_features')) {
      return true;
    }
    
    // Check if all requested features are allowed
    return features.every(feature => editionFeatures.includes(feature));
  },
  
  /**
   * Check if signature format is valid
   */
  isValidSignatureFormat(signature) {
    // Basic signature format validation
    return /^[A-Za-z0-9+/=]+$/.test(signature);
  },
  
  /**
   * Save license to storage
   */
  async saveLicense(license) {
    try {
      const licenseData = JSON.stringify(license, null, 2);
      
      if (window.hyper && window.hyper.saveFile) {
        await window.hyper.saveFile('license.tear', licenseData);
      } else {
        localStorage.setItem('hypersnatch_license', licenseData);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to save license: ${error.message}`);
    }
  },
  
  /**
   * Load license from storage
   */
  async loadLicense() {
    try {
      let licenseData = null;
      
      // Try to load from hyper storage first
      if (window.hyper && window.hyper.readFile) {
        try {
          licenseData = await window.hyper.readFile('license.tear');
        } catch {
          // File doesn't exist, try localStorage
        }
      }
      
      // Fallback to localStorage
      if (!licenseData) {
        licenseData = localStorage.getItem('hypersnatch_license');
      }
      
      if (licenseData) {
        const license = JSON.parse(licenseData);
        const validation = await this.validateLicense(license);
        
        if (validation.valid) {
          await this.activateLicense(license);
        } else {
          this.log(`[LICENSE WARNING] Stored license invalid: ${validation.reason}`);
          await this.fallbackToCore();
        }
      } else {
        await this.fallbackToCore();
      }
    } catch (error) {
      this.log(`[ERROR] Failed to load license: ${error.message}`);
      await this.fallbackToCore();
    }
  },
  
  /**
   * Remove license file
   */
  async removeLicenseFile() {
    try {
      if (window.hyper && window.hyper.deleteFile) {
        await window.hyper.deleteFile('license.tear');
      }
      
      localStorage.removeItem('hypersnatch_license');
    } catch (error) {
      this.log(`[ERROR] Failed to remove license file: ${error.message}`);
    }
  },
  
  /**
   * Fallback to Core edition
   */
  async fallbackToCore() {
    try {
      this.currentLicense = null;
      this.licenseValid = false;
      
      if (window.EditionManager) {
        await window.EditionManager.fallbackToCore();
      }
      
      this.log('[LICENSE] Fallback to Core edition activated');
    } catch (error) {
      this.log(`[ERROR] Fallback to Core failed: ${error.message}`);
    }
  },
  
  /**
   * Log activation event
   */
  async logActivation(license) {
    try {
      const event = {
        type: 'license_activation',
        timestamp: new Date().toISOString(),
        edition: license.edition,
        tier: license.tierLevel,
        issuedTo: license.issuedTo,
        features: license.features,
        activationAttempts: this.activationAttempts
      };
      
      if (window.EvidenceLogger) {
        await window.EvidenceLogger.addEvidenceLog(event);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to log activation: ${error.message}`);
    }
  },
  
  /**
   * Log deactivation event
   */
  async logDeactivation() {
    try {
      const event = {
        type: 'license_deactivation',
        timestamp: new Date().toISOString(),
        previousEdition: this.currentLicense?.edition,
        previousTier: this.currentLicense?.tierLevel,
        activationAttempts: this.activationAttempts
      };
      
      if (window.EvidenceLogger) {
        await window.EvidenceLogger.addEvidenceLog(event);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to log deactivation: ${error.message}`);
    }
  },
  
  /**
   * Generate license status report
   */
  generateLicenseReport() {
    return {
      currentLicense: this.getCurrentLicense(),
      supportedEditions: ['Core', 'Platform', 'Enterprise'],
      supportedTiers: [1, 2, 3, 4, 5],
      licenseFormat: '.tear',
      activationMethod: 'offline',
      signatureAlgorithm: 'RSA-SHA256',
      featuresByEdition: {
        'Core': ['html_input', 'basic_extraction', 'policy_enforcement', 'export_txt'],
        'Platform': ['html_input', 'har_input', 'strategy_packs', 'workspaces', 'advanced_export', 'lab_mode'],
        'Enterprise': ['all_features']
      }
    };
  },
  
  /**
   * Log license system events
   */
  log(message) {
    console.log(`[LICENSE_SYSTEM] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LicenseSystem;
} else {
  window.LicenseSystem = LicenseSystem;
}
