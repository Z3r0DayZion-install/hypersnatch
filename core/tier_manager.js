/**
 * Tier Manager
 * Provides capability gating and tier-based feature control
 */

const TierManager = {
  // Module metadata
  name: 'tier_manager',
  version: '1.0.0',
  description: 'Capability gating and tier-based feature control system',

  // State
  initialized: false,
  currentTier: null,
  availableTiers: new Set(),

  // Tier definitions
  tiers: {
    TIER_1: {
      name: 'Basic DOM Resurrection',
      level: 1,
      capabilities: [
        'basic_html_parsing',
        'simple_link_extraction',
        'basic_candidate_scoring',
        'local_file_input'
      ],
      features: [
        'html_input',
        'basic_resurrection',
        'simple_export',
        'evidence_logging'
      ],
      limits: {
        maxInputSize: '1MB',
        maxCandidates: 100,
        maxWorkspaces: 1,
        strategyPacks: false
      }
    },

    TIER_2: {
      name: 'HAR Analysis',
      level: 2,
      capabilities: [
        'har_file_parsing',
        'network_analysis',
        'response_inspection',
        'timeline_analysis'
      ],
      features: [
        'har_input',
        'network_analysis',
        'timeline_view',
        'advanced_export'
      ],
      limits: {
        maxInputSize: '5MB',
        maxCandidates: 500,
        maxWorkspaces: 3,
        strategyPacks: false
      },
      requires: ['TIER_1']
    },

    TIER_3: {
      name: 'Strategy Pack Loading',
      level: 3,
      capabilities: [
        'strategy_pack_loading',
        'custom_rules',
        'pack_validation',
        'pack_management'
      ],
      features: [
        'strategy_marketplace',
        'pack_import',
        'pack_management',
        'custom_analysis'
      ],
      limits: {
        maxInputSize: '10MB',
        maxCandidates: 1000,
        maxWorkspaces: 5,
        strategyPacks: true,
        maxStrategyPacks: 5
      },
      requires: ['TIER_1', 'TIER_2']
    },

    TIER_4: {
      name: 'Workspace Isolation',
      level: 4,
      capabilities: [
        'workspace_management',
        'case_isolation',
        'role_based_access',
        'audit_trails'
      ],
      features: [
        'multi_workspace',
        'case_management',
        'role_management',
        'audit_reports'
      ],
      limits: {
        maxInputSize: '50MB',
        maxCandidates: 5000,
        maxWorkspaces: 20,
        strategyPacks: true,
        maxStrategyPacks: 10
      },
      requires: ['TIER_1', 'TIER_2', 'TIER_3']
    },

    TIER_5: {
      name: 'Enterprise Mode',
      level: 5,
      capabilities: [
        'enterprise_features',
        'advanced_security',
        'api_access',
        'system_integration'
      ],
      features: [
        'enterprise_mode',
        'api_endpoints',
        'system_integration',
        'advanced_security'
      ],
      limits: {
        maxInputSize: '100MB',
        maxCandidates: 10000,
        maxWorkspaces: 100,
        strategyPacks: true,
        maxStrategyPacks: 50
      },
      requires: ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4']
    }
  },

  /**
   * Initialize tier manager
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      // Load available tiers from license/configuration
      await this.loadAvailableTiers();

      // Set current tier
      await this.setCurrentTier();

      this.initialized = true;
      this.log('[TIER] Tier manager initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Tier manager initialization failed: ${error.message}`);
      return false;
    }
  },

  /**
   * Check if tier is available
   */
  has(tierName) {
    return this.availableTiers.has(tierName);
  },

  /**
   * Check if capability is available
   */
  hasCapability(capability) {
    for (const tierName of this.availableTiers) {
      const tier = this.tiers[tierName];
      if (tier && tier.capabilities.includes(capability)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Check if feature is available
   */
  hasFeature(feature) {
    for (const tierName of this.availableTiers) {
      const tier = this.tiers[tierName];
      if (tier && tier.features.includes(feature)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Get current tier
   */
  getCurrentTier() {
    return this.currentTier ? this.tiers[this.currentTier] : null;
  },

  /**
   * Get available tiers
   */
  getAvailableTiers() {
    return Array.from(this.availableTiers).map(tierName => ({
      name: tierName,
      ...this.tiers[tierName]
    }));
  },

  /**
   * Set current tier
   */
  async setCurrentTier(tierName = null) {
    try {
      const targetTier = tierName || this.getHighestAvailableTier();

      if (!targetTier) {
        throw new Error('No tiers available');
      }

      if (!this.has(targetTier)) {
        throw new Error(`Tier not available: ${targetTier}`);
      }

      this.currentTier = targetTier;

      // Apply tier restrictions
      await this.applyTierRestrictions();

      this.log(`[TIER] Current tier set to: ${targetTier}`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to set current tier: ${error.message}`);
      throw error;
    }
  },

  /**
   * Block feature if not available
   */
  requireFeature(feature, customMessage = null) {
    if (!this.hasFeature(feature)) {
      const message = customMessage || `${feature} not available in current tier`;
      throw new Error(`Feature blocked: ${message}`);
    }
    return true;
  },

  /**
   * Block capability if not available
   */
  requireCapability(capability, customMessage = null) {
    if (!this.hasCapability(capability)) {
      const message = customMessage || `${capability} not available in current tier`;
      throw new Error(`Capability blocked: ${message}`);
    }
    return true;
  },

  /**
   * Validate input against tier limits
   */
  validateInput(inputSize, candidateCount) {
    const currentTier = this.getCurrentTier();
    if (!currentTier) {
      throw new Error('No current tier set');
    }

    const limits = currentTier.limits;

    // Check input size
    const maxSizeBytes = this.parseSize(limits.maxInputSize);
    if (inputSize > maxSizeBytes) {
      throw new Error(`Input size ${inputSize} exceeds tier limit of ${limits.maxInputSize}`);
    }

    // Check candidate count
    if (candidateCount > limits.maxCandidates) {
      throw new Error(`Candidate count ${candidateCount} exceeds tier limit of ${limits.maxCandidates}`);
    }

    return true;
  },

  /**
   * Get tier limits
   */
  getLimits() {
    const currentTier = this.getCurrentTier();
    return currentTier ? currentTier.limits : null;
  },

  /**
   * Check tier requirements
   */
  checkRequirements(tierName) {
    const tier = this.tiers[tierName];
    if (!tier) {
      return false;
    }

    if (!tier.requires) {
      return true;
    }

    return tier.requires.every(requiredTier => this.has(requiredTier));
  },

  /**
   * Get tier upgrade path
   */
  getUpgradePath(targetTier) {
    const path = [];
    const visited = new Set();

    const buildPath = (currentTier) => {
      if (visited.has(currentTier)) {
        return false;
      }

      visited.add(currentTier);

      if (currentTier === targetTier) {
        return true;
      }

      const tier = this.tiers[currentTier];
      if (!tier || !tier.requires) {
        return false;
      }

      for (const requiredTier of tier.requires) {
        if (buildPath(requiredTier)) {
          path.unshift(requiredTier);
          return true;
        }
      }

      return false;
    };

    if (buildPath(targetTier)) {
      path.push(targetTier);
      return path;
    }

    return [];
  },

  /**
   * Apply tier restrictions to UI
   */
  async applyTierRestrictions() {
    try {
      const currentTier = this.getCurrentTier();
      if (!currentTier) {
        return;
      }

      // Apply feature restrictions
      this.applyUIFeatureRestrictions(currentTier);

      // Apply capability restrictions
      this.applyUICapabilityRestrictions(currentTier);

      // Update tier indicator
      this.updateTierIndicator(currentTier);

    } catch (error) {
      this.log(`[ERROR] Failed to apply tier restrictions: ${error.message}`);
    }
  },

  /**
   * Apply UI feature restrictions
   */
  applyUIFeatureRestrictions(tier) {
    const featureElements = {
      'harInput': 'har_input',
      'strategyMarketplace': 'strategy_marketplace',
      'multiWorkspace': 'multi_workspace',
      'enterpriseMode': 'enterprise_mode',
      'apiAccess': 'api_access'
    };

    Object.entries(featureElements).forEach(([elementId, feature]) => {
      const element = document.getElementById(elementId);
      if (element) {
        const available = this.hasFeature(feature);
        element.style.display = available ? '' : 'none';
        element.disabled = !available;

        if (!available) {
          element.title = `${feature} requires higher tier`;
        }
      }
    });
  },

  /**
   * Apply UI capability restrictions
   */
  applyUICapabilityRestrictions(tier) {
    const capabilityElements = {
      'advancedExport': 'advanced_export',
      'customAnalysis': 'custom_analysis',
      'auditReports': 'audit_reports',
      'systemIntegration': 'system_integration'
    };

    Object.entries(capabilityElements).forEach(([elementId, capability]) => {
      const element = document.getElementById(elementId);
      if (element) {
        const available = this.hasCapability(capability);
        element.style.display = available ? '' : 'none';
        element.disabled = !available;

        if (!available) {
          element.title = `${capability} requires higher tier`;
        }
      }
    });
  },

  /**
   * Update tier indicator
   */
  updateTierIndicator(tier) {
    const tierIndicator = document.getElementById('tierIndicator');
    if (tierIndicator) {
      tierIndicator.textContent = `Tier: ${tier.name}`;
      tierIndicator.className = `tier-indicator tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`;
    }
  },

  /**
   * Load available tiers
   */
  async loadAvailableTiers() {
    try {
      // In a real implementation, this would load from license file
      // For now, we'll simulate a license that grants TIER_1 and TIER_2
      const licensedTiers = ['TIER_1', 'TIER_2', 'TIER_3'];

      this.availableTiers.clear();
      licensedTiers.forEach(tier => {
        if (this.tiers[tier]) {
          this.availableTiers.add(tier);
        }
      });

      this.log(`[TIER] Loaded ${this.availableTiers.size} available tiers`);
    } catch (error) {
      this.log(`[ERROR] Failed to load available tiers: ${error.message}`);
      // Default to TIER_1
      this.availableTiers.add('TIER_1');
    }
  },

  /**
   * Get highest available tier
   */
  getHighestAvailableTier() {
    let highestTier = null;
    let highestLevel = 0;

    for (const tierName of this.availableTiers) {
      const tier = this.tiers[tierName];
      if (tier && tier.level > highestLevel) {
        highestLevel = tier.level;
        highestTier = tierName;
      }
    }

    return highestTier;
  },

  /**
   * Parse size string to bytes
   */
  parseSize(sizeStr) {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) {
      return 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    return value * units[unit];
  },

  /**
   * Generate tier report
   */
  generateTierReport() {
    const currentTier = this.getCurrentTier();
    const availableTiers = this.getAvailableTiers();

    return {
      currentTier: currentTier ? {
        name: currentTier.name,
        level: currentTier.level,
        capabilities: currentTier.capabilities,
        features: currentTier.features,
        limits: currentTier.limits
      } : null,
      availableTiers: availableTiers.map(tier => ({
        name: tier.name,
        level: tier.level,
        capabilitiesCount: tier.capabilities.length,
        featuresCount: tier.features.length
      })),
      totalCapabilities: this.getTotalCapabilities(),
      totalFeatures: this.getTotalFeatures(),
      upgradePaths: this.getUpgradePaths()
    };
  },

  /**
   * Get total capabilities available
   */
  getTotalCapabilities() {
    const capabilities = new Set();
    for (const tierName of this.availableTiers) {
      const tier = this.tiers[tierName];
      if (tier) {
        tier.capabilities.forEach(cap => capabilities.add(cap));
      }
    }
    return capabilities.size;
  },

  /**
   * Get total features available
   */
  getTotalFeatures() {
    const features = new Set();
    for (const tierName of this.availableTiers) {
      const tier = this.tiers[tierName];
      if (tier) {
        tier.features.forEach(feature => features.add(feature));
      }
    }
    return features.size;
  },

  /**
   * Get upgrade paths for unavailable tiers
   */
  getUpgradePaths() {
    const paths = {};
    for (const tierName of Object.keys(this.tiers)) {
      if (!this.has(tierName)) {
        paths[tierName] = this.getUpgradePath(tierName);
      }
    }
    return paths;
  },

  /**
   * Log tier manager events
   */
  log(message) {
    console.log(`[TIER_MANAGER] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TierManager;
} else {
  window.TierManager = TierManager;
}
