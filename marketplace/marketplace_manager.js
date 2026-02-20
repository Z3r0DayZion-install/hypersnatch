/**
 * Marketplace Manager
 * Strategy pack marketplace with verified and experimental sections
 */

const MarketplaceManager = {
  // Module metadata
  name: 'marketplace_manager',
  version: '1.0.0',
  description: 'Strategy pack marketplace with verified and experimental sections',
  
  // State
  initialized = false,
  availablePacks = new Map(),
  installedPacks = new Map(),
  marketplacePath = './marketplace',
  
  // Marketplace structure
  marketplaceStructure = {
    verified: {
      path: './marketplace/verified/',
      description: 'Verified strategy packs with full testing and signing',
      requirements: ['signature', 'testing', 'documentation'],
      autoUpdate: true
    },
    experimental: {
      path: './marketplace/experimental/',
      description: 'Experimental packs for testing and development',
      requirements: ['basic_validation'],
      autoUpdate: false,
      labModeOnly: true
    }
  },
  
  /**
   * Initialize marketplace manager
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure marketplace directories exist
      await this.ensureMarketplaceDirectories();
      
      // Load available packs
      await this.loadAvailablePacks();
      
      // Load installed packs
      await this.loadInstalledPacks();
      
      this.initialized = true;
      this.log('[MARKETPLACE] Marketplace manager initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Marketplace manager initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Get available strategy packs
   */
  getAvailablePacks(category = 'all') {
    const packs = [];
    
    for (const [packId, pack] of this.availablePacks) {
      if (category === 'all' || pack.category === category) {
        packs.push({
          id: packId,
          name: pack.name,
          version: pack.version,
          description: pack.description,
          author: pack.author,
          category: pack.category,
          signature: pack.signature,
          verified: pack.verified,
          experimental: pack.experimental,
          requirements: pack.requirements,
          compatibility: pack.compatibility,
          downloadCount: pack.downloadCount || 0,
          rating: pack.rating || 0,
          lastUpdated: pack.lastUpdated
        });
      }
    }
    
    return packs.sort((a, b) => b.downloadCount - a.downloadCount);
  },
  
  /**
   * Get installed strategy packs
   */
  getInstalledPacks() {
    const packs = [];
    
    for (const [packId, pack] of this.installedPacks) {
      packs.push({
        id: packId,
        name: pack.name,
        version: pack.version,
        description: pack.description,
        author: pack.author,
        category: pack.category,
        installedAt: pack.installedAt,
        signature: pack.signature,
        verified: pack.verified,
        experimental: pack.experimental,
        enabled: pack.enabled,
        lastUsed: pack.lastUsed
      });
    }
    
    return packs.sort((a, b) => new Date(b.installedAt) - new Date(a.installedAt));
  },
  
  /**
   * Install strategy pack
   */
  async installPack(packId, options = {}) {
    try {
      const pack = this.availablePacks.get(packId);
      if (!pack) {
        throw new Error(`Strategy pack not found: ${packId}`);
      }
      
      // Check if already installed
      if (this.installedPacks.has(packId)) {
        throw new Error(`Strategy pack already installed: ${packId}`);
      }
      
      // Validate installation requirements
      await this.validateInstallationRequirements(pack, options);
      
      // Download pack
      const packData = await this.downloadPack(pack);
      
      // Verify pack
      await this.verifyPack(pack, packData);
      
      // Install pack
      const installedPack = await this.installPackData(packId, pack, packData);
      
      // Register installed pack
      this.installedPacks.set(packId, installedPack);
      
      // Load pack in strategy runtime
      if (window.StrategyRuntime) {
        await window.StrategyRuntime.loadStrategyPack(
          installedPack.installPath,
          installedPack.signature
        );
      }
      
      this.log(`[MARKETPLACE] Installed strategy pack: ${packId}`);
      return installedPack;
    } catch (error) {
      this.log(`[ERROR] Failed to install strategy pack: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Uninstall strategy pack
   */
  async uninstallPack(packId) {
    try {
      const pack = this.installedPacks.get(packId);
      if (!pack) {
        throw new Error(`Strategy pack not installed: ${packId}`);
      }
      
      // Unload from strategy runtime
      if (window.StrategyRuntime) {
        window.StrategyRuntime.unloadStrategyPack(packId);
      }
      
      // Remove pack files
      await this.removePackFiles(pack);
      
      // Unregister pack
      this.installedPacks.delete(packId);
      
      this.log(`[MARKETPLACE] Uninstalled strategy pack: ${packId}`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to uninstall strategy pack: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Enable/disable installed pack
   */
  async togglePack(packId, enabled) {
    try {
      const pack = this.installedPacks.get(packId);
      if (!pack) {
        throw new Error(`Strategy pack not installed: ${packId}`);
      }
      
      pack.enabled = enabled;
      pack.lastModified = new Date().toISOString();
      
      if (enabled) {
        // Load pack in strategy runtime
        if (window.StrategyRuntime) {
          await window.StrategyRuntime.loadStrategyPack(
            pack.installPath,
            pack.signature
          );
        }
      } else {
        // Unload from strategy runtime
        if (window.StrategyRuntime) {
          window.StrategyRuntime.unloadStrategyPack(packId);
        }
      }
      
      this.log(`[MARKETPLACE] ${enabled ? 'Enabled' : 'Disabled'} strategy pack: ${packId}`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to toggle strategy pack: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Update strategy pack
   */
  async updatePack(packId) {
    try {
      const installedPack = this.installedPacks.get(packId);
      const availablePack = this.availablePacks.get(packId);
      
      if (!installedPack || !availablePack) {
        throw new Error(`Strategy pack not found: ${packId}`);
      }
      
      // Check if update available
      if (installedPack.version === availablePack.version) {
        return { updated: false, reason: 'Already up to date' };
      }
      
      // Uninstall current version
      await this.uninstallPack(packId);
      
      // Install new version
      await this.installPack(packId);
      
      this.log(`[MARKETPLACE] Updated strategy pack: ${packId}`);
      return { updated: true, oldVersion: installedPack.version, newVersion: availablePack.version };
    } catch (error) {
      this.log(`[ERROR] Failed to update strategy pack: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Search strategy packs
   */
  searchPacks(query, filters = {}) {
    const results = [];
    const searchQuery = query.toLowerCase();
    
    for (const [packId, pack] of this.availablePacks) {
      let matches = true;
      
      // Text search
      if (searchQuery) {
        const searchText = `${pack.name} ${pack.description} ${pack.author}`.toLowerCase();
        matches = searchText.includes(searchQuery);
      }
      
      // Apply filters
      if (matches && filters.category && filters.category !== 'all') {
        matches = pack.category === filters.category;
      }
      
      if (matches && filters.verified !== undefined) {
        matches = pack.verified === filters.verified;
      }
      
      if (matches && filters.experimental !== undefined) {
        matches = pack.experimental === filters.experimental;
      }
      
      if (matches && filters.author) {
        matches = pack.author.toLowerCase().includes(filters.author.toLowerCase());
      }
      
      if (matches) {
        results.push({
          id: packId,
          name: pack.name,
          version: pack.version,
          description: pack.description,
          author: pack.author,
          category: pack.category,
          verified: pack.verified,
          experimental: pack.experimental,
          downloadCount: pack.downloadCount || 0,
          rating: pack.rating || 0,
          relevanceScore: this.calculateRelevanceScore(pack, searchQuery)
        });
      }
    }
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  },
  
  /**
   * Get pack details
   */
  getPackDetails(packId) {
    const availablePack = this.availablePacks.get(packId);
    const installedPack = this.installedPacks.get(packId);
    
    if (!availablePack) {
      return null;
    }
    
    return {
      ...availablePack,
      installed: !!installedPack,
      installedAt: installedPack?.installedAt,
      enabled: installedPack?.enabled,
      lastUsed: installedPack?.lastUsed,
      canUpdate: installedPack && installedPack.version !== availablePack.version
    };
  },
  
  /**
   * Validate installation requirements
   */
  async validateInstallationRequirements(pack, options) {
    // Check lab mode requirement for experimental packs
    if (pack.experimental && !this.isLabModeEnabled()) {
      throw new Error('Experimental packs require Lab Mode to be enabled');
    }
    
    // Check tier requirements
    if (pack.requirements && pack.requirements.tier) {
      if (window.TierManager && !window.TierManager.has(pack.requirements.tier)) {
        throw new Error(`Pack requires tier: ${pack.requirements.tier}`);
      }
    }
    
    // Check role requirements
    if (pack.requirements && pack.requirements.role) {
      if (window.RoleManager && !window.RoleManager.hasPermission('canLoadUnsignedPacks')) {
        if (!pack.signature) {
          throw new Error('Pack requires signature for current role');
        }
      }
    }
    
    return true;
  },
  
  /**
   * Download pack
   */
  async downloadPack(pack) {
    try {
      // In a real implementation, this would download from a repository
      // For now, we'll simulate by reading from local marketplace
      const packPath = `${pack.category === 'verified' ? this.marketplaceStructure.verified.path : this.marketplaceStructure.experimental.path}${packId}`;
      
      if (window.hyper && window.hyper.readFile) {
        const packData = await window.hyper.readFile(packPath);
        return JSON.parse(packData);
      }
      
      throw new Error('Pack download not available');
    } catch (error) {
      this.log(`[ERROR] Failed to download pack: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Verify pack
   */
  async verifyPack(pack, packData) {
    try {
      // Verify signature if present
      if (pack.signature) {
        const signatureValid = await this.verifySignature(packData, pack.signature);
        if (!signatureValid) {
          throw new Error('Invalid pack signature');
        }
      }
      
      // Verify manifest
      if (!packData.manifest) {
        throw new Error('Missing pack manifest');
      }
      
      // Verify compatibility
      if (packData.compatibility) {
        const compatible = this.verifyCompatibility(packData.compatibility);
        if (!compatible) {
          throw new Error('Pack not compatible with current platform');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`[ERROR] Pack verification failed: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Install pack data
   */
  async installPackData(packId, pack, packData) {
    try {
      const installPath = `./strategy-packs/${packId}`;
      
      // Create installation directory
      if (window.hyper && window.hyper.ensureDirectory) {
        await window.hyper.ensureDirectory(installPath);
      }
      
      // Install pack files
      const installedPack = {
        id: packId,
        name: pack.name,
        version: pack.version,
        description: pack.description,
        author: pack.author,
        category: pack.category,
        signature: pack.signature,
        verified: pack.verified,
        experimental: pack.experimental,
        installPath,
        installedAt: new Date().toISOString(),
        enabled: true,
        lastModified: new Date().toISOString(),
        packData
      };
      
      // Save pack manifest
      if (window.hyper && window.hyper.saveFile) {
        await window.hyper.saveFile(`${installPath}/pack.json`, JSON.stringify(packData.manifest, null, 2));
        await window.hyper.saveFile(`${installPath}/strategy.js`, packData.strategy);
      }
      
      return installedPack;
    } catch (error) {
      this.log(`[ERROR] Failed to install pack data: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Remove pack files
   */
  async removePackFiles(pack) {
    try {
      if (window.hyper && window.hyper.deleteDirectory) {
        await window.hyper.deleteDirectory(pack.installPath);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to remove pack files: ${error.message}`);
    }
  },
  
  /**
   * Verify signature
   */
  async verifySignature(data, signature) {
    // In a real implementation, this would verify cryptographic signatures
    // For now, we'll simulate signature verification
    return true;
  },
  
  /**
   * Verify compatibility
   */
  verifyCompatibility(compatibility) {
    // Check engine version compatibility
    if (compatibility.engineVersion) {
      const currentEngine = 'RES-CORE-01';
      if (compatibility.engineVersion !== currentEngine) {
        return false;
      }
    }
    
    // Check policy version compatibility
    if (compatibility.policyVersion) {
      const currentPolicy = 'CASH-SHIELD-01';
      if (compatibility.policyVersion !== currentPolicy) {
        return false;
      }
    }
    
    // Check platform compatibility
    if (compatibility.platform) {
      const currentPlatform = 'electron';
      if (!compatibility.platform.includes(currentPlatform)) {
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * Calculate relevance score for search
   */
  calculateRelevanceScore(pack, query) {
    let score = 0;
    
    if (!query) return score;
    
    // Name matches
    if (pack.name.toLowerCase().includes(query)) {
      score += 10;
    }
    
    // Description matches
    if (pack.description.toLowerCase().includes(query)) {
      score += 5;
    }
    
    // Author matches
    if (pack.author.toLowerCase().includes(query)) {
      score += 3;
    }
    
    // Download count boost
    score += Math.log(pack.downloadCount || 1) * 0.1;
    
    // Rating boost
    score += (pack.rating || 0) * 0.5;
    
    return score;
  },
  
  /**
   * Check if lab mode is enabled
   */
  isLabModeEnabled() {
    // Check with UI or role manager
    if (window.UI && window.UI.state) {
      return window.UI.state.labMode || false;
    }
    return false;
  },
  
  /**
   * Ensure marketplace directories exist
   */
  async ensureMarketplaceDirectories() {
    if (window.hyper && window.hyper.ensureDirectory) {
      await window.hyper.ensureDirectory(this.marketplaceStructure.verified.path);
      await window.hyper.ensureDirectory(this.marketplaceStructure.experimental.path);
    }
  },
  
  /**
   * Load available packs
   */
  async loadAvailablePacks() {
    try {
      // Load verified packs
      await this.loadPacksFromDirectory(this.marketplaceStructure.verified.path, 'verified');
      
      // Load experimental packs
      await this.loadPacksFromDirectory(this.marketplaceStructure.experimental.path, 'experimental');
      
      this.log(`[MARKETPLACE] Loaded ${this.availablePacks.size} available packs`);
    } catch (error) {
      this.log(`[ERROR] Failed to load available packs: ${error.message}`);
    }
  },
  
  /**
   * Load packs from directory
   */
  async loadPacksFromDirectory(directoryPath, category) {
    // In a real implementation, this would scan the directory for pack manifests
    // For now, we'll add some sample packs
    
    if (category === 'verified') {
      // Add verified sample packs
      this.availablePacks.set('emload_v1', {
        name: 'Email Link Extraction',
        version: '1.0.0',
        description: 'Extracts and validates email links from HTML content',
        author: 'HyperSnatch Labs',
        category: 'verified',
        verified: true,
        experimental: false,
        signature: 'verified_signature_placeholder',
        requirements: { tier: 'TIER_3' },
        compatibility: {
          engineVersion: 'RES-CORE-01',
          policyVersion: 'CASH-SHIELD-01',
          platform: ['electron']
        },
        downloadCount: 1250,
        rating: 4.8,
        lastUpdated: '2026-02-18T10:20:00.000Z'
      });
      
      this.availablePacks.set('generic_dom_v1', {
        name: 'Generic DOM Analysis',
        version: '1.0.0',
        description: 'General-purpose DOM analysis and link extraction',
        author: 'HyperSnatch Labs',
        category: 'verified',
        verified: true,
        experimental: false,
        signature: 'verified_signature_placeholder',
        requirements: { tier: 'TIER_2' },
        compatibility: {
          engineVersion: 'RES-CORE-01',
          policyVersion: 'CASH-SHIELD-01',
          platform: ['electron']
        },
        downloadCount: 980,
        rating: 4.6,
        lastUpdated: '2026-02-18T10:20:00.000Z'
      });
    }
    
    if (category === 'experimental') {
      // Add experimental sample packs
      this.availablePacks.set('social_media_v1', {
        name: 'Social Media Link Extractor',
        version: '0.9.0-beta',
        description: 'Experimental social media platform link extraction',
        author: 'Community Contributor',
        category: 'experimental',
        verified: false,
        experimental: true,
        signature: null,
        requirements: { tier: 'TIER_3' },
        compatibility: {
          engineVersion: 'RES-CORE-01',
          policyVersion: 'CASH-SHIELD-01',
          platform: ['electron']
        },
        downloadCount: 45,
        rating: 3.2,
        lastUpdated: '2026-02-15T14:30:00.000Z'
      });
    }
  },
  
  /**
   * Load installed packs
   */
  async loadInstalledPacks() {
    try {
      // In a real implementation, this would load from installation directory
      // For now, we'll start with empty installed packs
      this.log(`[MARKETPLACE] Loaded ${this.installedPacks.size} installed packs`);
    } catch (error) {
      this.log(`[ERROR] Failed to load installed packs: ${error.message}`);
    }
  },
  
  /**
   * Generate marketplace statistics
   */
  generateMarketplaceStats() {
    const verifiedPacks = Array.from(this.availablePacks.values()).filter(p => p.verified);
    const experimentalPacks = Array.from(this.availablePacks.values()).filter(p => p.experimental);
    
    return {
      totalAvailable: this.availablePacks.size,
      verifiedCount: verifiedPacks.length,
      experimentalCount: experimentalPacks.length,
      installedCount: this.installedPacks.size,
      totalDownloads: Array.from(this.availablePacks.values()).reduce((sum, pack) => sum + (pack.downloadCount || 0), 0),
      averageRating: this.calculateAverageRating()
    };
  },
  
  /**
   * Calculate average rating
   */
  calculateAverageRating() {
    const packs = Array.from(this.availablePacks.values());
    if (packs.length === 0) return 0;
    
    const totalRating = packs.reduce((sum, pack) => sum + (pack.rating || 0), 0);
    return (totalRating / packs.length).toFixed(1);
  },
  
  /**
   * Log marketplace events
   */
  log(message) {
    console.log(`[MARKETPLACE_MANAGER] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarketplaceManager;
} else {
  window.MarketplaceManager = MarketplaceManager;
}
