/**
 * Feature Flags Engine
 * Dynamic capability control and feature management system
 */

const FeatureFlags = {
  // Module metadata
  name: 'feature_flags',
  version: '1.0.0',
  description: 'Dynamic capability control and feature management system',
  
  // State
  initialized: false,
  flags: new Map(),
  dynamicFlags: new Map(),
  
  // Feature definitions
  featureDefinitions: {
    // Core features
    HTML_INPUT: {
      name: 'HTML Input',
      description: 'Process HTML content and files',
      category: 'input',
      tier: 1,
      edition: 'all',
      dependencies: [],
      uiElements: ['htmlInput', 'fileInput']
    },
    
    HAR_ANALYSIS: {
      name: 'HAR Analysis',
      description: 'Analyze HAR files and network logs',
      category: 'analysis',
      tier: 2,
      edition: ['Platform', 'Enterprise'],
      dependencies: [],
      uiElements: ['harInput', 'harViewer']
    },
    
    STRATEGY_PACKS: {
      name: 'Strategy Packs',
      description: 'Load and use custom strategy packs',
      category: 'extensions',
      tier: 3,
      edition: ['Platform', 'Enterprise'],
      dependencies: ['STRATEGY_RUNTIME'],
      uiElements: ['strategyTab', 'packManager']
    },
    
    WORKSPACES: {
      name: 'Workspaces',
      description: 'Multi-workspace case management',
      category: 'organization',
      tier: 4,
      edition: ['Platform', 'Enterprise'],
      dependencies: ['WORKSPACE_MANAGER'],
      uiElements: ['workspaceTab', 'caseManager']
    },
    
    ENTERPRISE_LOCK: {
      name: 'Enterprise Lock',
      description: 'Enterprise-grade security and compliance',
      category: 'security',
      tier: 5,
      edition: ['Enterprise'],
      dependencies: ['ENTERPRISE_MANAGER'],
      uiElements: ['enterpriseBadge', 'compliancePanel']
    },
    
    // Analysis features
    ADVANCED_EXTRACTION: {
      name: 'Advanced Extraction',
      description: 'Advanced link and content extraction',
      category: 'analysis',
      tier: 2,
      edition: ['Platform', 'Enterprise'],
      dependencies: ['HTML_INPUT'],
      uiElements: ['advancedOptions', 'extractionSettings']
    },
    
    CUSTOM_ANALYSIS: {
      name: 'Custom Analysis',
      description: 'Custom analysis rules and patterns',
      category: 'analysis',
      tier: 3,
      edition: ['Platform', 'Enterprise'],
      dependencies: ['STRATEGY_PACKS'],
      uiElements: ['customRules', 'analysisEditor']
    },
    
    // Export features
    ADVANCED_EXPORT: {
      name: 'Advanced Export',
      description: 'Multiple export formats and options',
      category: 'export',
      tier: 2,
      edition: ['Platform', 'Enterprise'],
      dependencies: ['HTML_INPUT'],
      uiElements: ['exportOptions', 'formatSelector']
    },
    
    CASE_REPORTS: {
      name: 'Case Reports',
      description: 'Comprehensive case report generation',
      category: 'export',
      tier: 4,
      edition: ['Platform', 'Enterprise'],
      dependencies: ['WORKSPACES'],
      uiElements: ['reportGenerator', 'reportTemplates']
    },
    
    // Security features
    LAB_MODE: {
      name: 'Lab Mode',
      description: 'Development and testing mode',
      category: 'development',
      tier: 3,
      edition: ['Platform'],
      dependencies: [],
      uiElements: ['labModeToggle', 'debugConsole']
    },
    
    DEBUG_CONSOLE: {
      name: 'Debug Console',
      description: 'Developer debug console',
      category: 'development',
      tier: 1,
      edition: ['Core'],
      dependencies: [],
      uiElements: ['logBox', 'debugPanel']
    },
    
    // Integration features
    API_ACCESS: {
      name: 'API Access',
      description: 'Programmatic API access',
      category: 'integration',
      tier: 5,
      edition: ['Enterprise'],
      dependencies: ['ENTERPRISE_LOCK'],
      uiElements: ['apiDocs', 'apiKeys']
    },
    
    NEURALOS_INTEGRATION: {
      name: 'NeuralOS Integration',
      description: 'NeuralOS host environment integration',
      category: 'integration',
      tier: 4,
      edition: ['Enterprise'],
      dependencies: ['API_ACCESS'],
      uiElements: ['neuralOSPanel', 'hostSettings']
    }
  },
  
  /**
   * Initialize feature flags
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load static flags from edition
      await this.loadStaticFlags();
      
      // Load dynamic flags from license
      await this.loadDynamicFlags();
      
      // Apply feature flags to UI
      await this.applyFeatureFlags();
      
      this.initialized = true;
      this.log('[FEATURES] Feature flags initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Feature flags initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Check if feature is enabled
   */
  isEnabled(featureName) {
    return this.flags.get(featureName) === true;
  },
  
  /**
   * Enable feature
   */
  async enableFeature(featureName) {
    try {
      // Check if feature exists
      const feature = this.featureDefinitions[featureName];
      if (!feature) {
        throw new Error(`Unknown feature: ${featureName}`);
      }
      
      // Check dependencies
      if (!this.checkDependencies(feature.dependencies)) {
        throw new Error(`Dependencies not met for feature: ${featureName}`);
      }
      
      // Set flag
      this.flags.set(featureName, true);
      
      // Apply to UI
      await this.enableFeatureUI(feature);
      
      // Log enablement
      await this.logFeatureChange(featureName, 'enabled');
      
      this.log(`[FEATURES] Feature enabled: ${featureName}`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to enable feature: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Disable feature
   */
  async disableFeature(featureName) {
    try {
      // Check if feature exists
      if (!this.featureDefinitions[featureName]) {
        throw new Error(`Unknown feature: ${featureName}`);
      }
      
      // Set flag
      this.flags.set(featureName, false);
      
      // Apply to UI
      await this.disableFeatureUI(featureName);
      
      // Log disablement
      await this.logFeatureChange(featureName, 'disabled');
      
      this.log(`[FEATURES] Feature disabled: ${featureName}`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to disable feature: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Get feature status
   */
  getFeatureStatus(featureName) {
    const feature = this.featureDefinitions[featureName];
    if (!feature) {
      return null;
    }
    
    return {
      name: feature.name,
      description: feature.description,
      category: feature.category,
      tier: feature.tier,
      edition: feature.edition,
      enabled: this.flags.get(featureName),
      dynamic: this.dynamicFlags.get(featureName),
      dependencies: feature.dependencies,
      uiElements: feature.uiElements
    };
  },
  
  /**
   * Get all features
   */
  getAllFeatures() {
    const features = [];
    
    Object.entries(this.featureDefinitions).forEach(([key, feature]) => {
      features.push({
        key,
        name: feature.name,
        description: feature.description,
        category: feature.category,
        tier: feature.tier,
        edition: feature.edition,
        enabled: this.flags.get(key),
        dynamic: this.dynamicFlags.get(key),
        dependencies: feature.dependencies,
        uiElements: feature.uiElements
      });
    });
    
    return features;
  },
  
  /**
   * Get features by category
   */
  getFeaturesByCategory(category) {
    return this.getAllFeatures().filter(feature => feature.category === category);
  },
  
  /**
   * Get features by tier
   */
  getFeaturesByTier(tier) {
    return this.getAllFeatures().filter(feature => feature.tier === tier);
  },
  
  /**
   * Block feature with message
   */
  blockFeature(featureName, message = null) {
    const feature = this.featureDefinitions[featureName];
    if (!feature) return;
    
    const blockMessage = message || `${feature.name} not available in current edition/tier`;
    
    // Disable UI elements
    if (feature.uiElements) {
      feature.uiElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
          element.disabled = true;
          element.title = blockMessage;
          element.style.opacity = '0.5';
        }
      });
    }
    
    // Show blocking message
    this.showBlockingMessage(featureName, blockMessage);
    
    this.log(`[FEATURES] Feature blocked: ${featureName} - ${blockMessage}`);
  },
  
  /**
   * Load static flags from edition
   */
  async loadStaticFlags() {
    try {
      // Get current edition from edition manager
      if (window.EditionManager) {
        const edition = window.EditionManager.getCurrentEdition();
        const editionName = edition.name;
        
        // Set flags based on edition
        Object.entries(this.featureDefinitions).forEach(([key, feature]) => {
          let enabled = false;
          
          if (feature.edition === 'all' || feature.edition.includes(editionName)) {
            enabled = true;
          }
          
          this.flags.set(key, enabled);
        });
        
        this.log(`[FEATURES] Loaded ${editionName} edition flags`);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to load static flags: ${error.message}`);
    }
  },
  
  /**
   * Load dynamic flags from license
   */
  async loadDynamicFlags() {
    try {
      // Get current license
      if (window.LicenseSystem) {
        const license = window.LicenseSystem.getCurrentLicense();
        
        if (license.valid && license.license && license.license.features) {
          // Set dynamic flags from license features
          license.license.features.forEach(featureName => {
            this.dynamicFlags.set(featureName, true);
            
            // Override static flag if feature exists
            if (this.featureDefinitions[featureName]) {
              this.flags.set(featureName, true);
            }
          });
          
          this.log(`[FEATURES] Loaded ${license.license.features.length} dynamic flags from license`);
        }
      }
    } catch (error) {
      this.log(`[ERROR] Failed to load dynamic flags: ${error.message}`);
    }
  },
  
  /**
   * Apply feature flags to UI
   */
  async applyFeatureFlags() {
    try {
      Object.entries(this.featureDefinitions).forEach(([key, feature]) => {
        const enabled = this.flags.get(key);
        
        if (enabled) {
          this.enableFeatureUI(feature);
        } else {
          this.disableFeatureUI(feature);
        }
      });
      
      this.log('[FEATURES] Applied feature flags to UI');
    } catch (error) {
      this.log(`[ERROR] Failed to apply feature flags: ${error.message}`);
    }
  },
  
  /**
   * Enable feature UI elements
   */
  async enableFeatureUI(feature) {
    if (!feature.uiElements) return;
    
    feature.uiElements.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        element.disabled = false;
        element.style.display = '';
        element.style.opacity = '1';
        element.title = '';
      }
    });
  },
  
  /**
   * Disable feature UI elements
   */
  async disableFeatureUI(feature) {
    if (!feature.uiElements) return;
    
    feature.uiElements.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        element.disabled = true;
        element.style.display = 'none';
        element.title = `${feature.name} not available`;
      }
    });
  },
  
  /**
   * Check dependencies
   */
  checkDependencies(dependencies) {
    if (!dependencies || dependencies.length === 0) {
      return true;
    }
    
    return dependencies.every(dep => this.flags.get(dep) === true);
  },
  
  /**
   * Show blocking message
   */
  showBlockingMessage(featureName, message) {
    // Create or update blocking message
    let blockingDiv = document.getElementById('feature-blocking-message');
    
    if (!blockingDiv) {
      blockingDiv = document.createElement('div');
      blockingDiv.id = 'feature-blocking-message';
      blockingDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;
      document.body.appendChild(blockingDiv);
    }
    
    blockingDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Feature Blocked</div>
      <div>${message}</div>
      <div style="margin-top: 10px; font-size: 10px; opacity: 0.8;">
        Feature: ${featureName}
      </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (blockingDiv.parentNode) {
        blockingDiv.parentNode.removeChild(blockingDiv);
      }
    }, 5000);
  },
  
  /**
   * Log feature change
   */
  async logFeatureChange(featureName, action) {
    try {
      const event = {
        type: 'feature_change',
        timestamp: new Date().toISOString(),
        feature: featureName,
        action: action,
        reason: 'user_action'
      };
      
      if (window.EvidenceLogger) {
        await window.EvidenceLogger.addEvidenceLog(event);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to log feature change: ${error.message}`);
    }
  },
  
  /**
   * Generate feature report
   */
  generateFeatureReport() {
    const features = this.getAllFeatures();
    
    return {
      totalFeatures: features.length,
      enabledFeatures: features.filter(f => f.enabled).length,
      dynamicFeatures: features.filter(f => f.dynamic).length,
      featuresByCategory: this.groupFeaturesByCategory(features),
      featuresByTier: this.groupFeaturesByTier(features),
      featureDefinitions: this.featureDefinitions,
      currentFlags: Object.fromEntries(this.flags),
      dynamicFlags: Object.fromEntries(this.dynamicFlags)
    };
  },
  
  /**
   * Group features by category
   */
  groupFeaturesByCategory(features) {
    const grouped = {};
    
    features.forEach(feature => {
      if (!grouped[feature.category]) {
        grouped[feature.category] = [];
      }
      grouped[feature.category].push(feature);
    });
    
    return grouped;
  },
  
  /**
   * Group features by tier
   */
  groupFeaturesByTier(features) {
    const grouped = {};
    
    features.forEach(feature => {
      if (!grouped[feature.tier]) {
        grouped[feature.tier] = [];
      }
      grouped[feature.tier].push(feature);
    });
    
    return grouped;
  },
  
  /**
   * Log feature flags events
   */
  log(message) {
    console.log(`[FEATURE_FLAGS] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeatureFlags;
} else {
  window.FeatureFlags = FeatureFlags;
}
