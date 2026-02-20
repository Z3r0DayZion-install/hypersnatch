/**
 * Workspace Manager
 * Provides workspace isolation and case management for HyperSnatch Platform
 */

const WorkspaceManager = {
  // Module metadata
  name: 'workspace_manager',
  version: '1.0.0',
  description: 'Workspace isolation and case management system',
  
  // State
  initialized: false,
  currentWorkspace = null,
  workspaceRegistry = new Map(),
  workspacePath = './workspaces',
  
  // Workspace structure
  workspaceTemplate = {
    id: null,
    name: '',
    description: '',
    createdAt: null,
    lastModified: null,
    role: 'Analyst',
    policyProfile: 'standard',
    tier: 'TIER_2',
    
    // Artifacts and data
    artifacts: [],
    evidenceLog: [],
    policySnapshot: {},
    loadedStrategyPacks: [],
    exportHistory: [],
    
    // Case metadata
    caseNumber: null,
    caseType: 'general',
    classification: 'unclassified',
    assignedTo: '',
    status: 'active',
    
    // Security
    accessLog: [],
    checksums: {},
    integrityVerified: true
  },
  
  /**
   * Initialize workspace manager
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure workspaces directory exists
      await this.ensureWorkspaceDirectory();
      
      // Load existing workspace registry
      await this.loadWorkspaceRegistry();
      
      this.initialized = true;
      this.log('[WORKSPACE] Workspace manager initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Workspace manager initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Create new workspace
   */
  async createWorkspace(options = {}) {
    try {
      const workspaceId = options.id || this.generateWorkspaceId();
      const workspaceName = options.name || `Case ${workspaceId}`;
      
      // Validate workspace doesn't exist
      if (this.workspaceRegistry.has(workspaceId)) {
        throw new Error(`Workspace already exists: ${workspaceId}`);
      }
      
      // Create workspace object
      const workspace = {
        ...this.workspaceTemplate,
        id: workspaceId,
        name: workspaceName,
        description: options.description || '',
        caseNumber: options.caseNumber || this.generateCaseNumber(),
        caseType: options.caseType || 'general',
        classification: options.classification || 'unclassified',
        assignedTo: options.assignedTo || '',
        role: options.role || 'Analyst',
        policyProfile: options.policyProfile || 'standard',
        tier: options.tier || 'TIER_2',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      // Create workspace directory
      await this.createWorkspaceDirectory(workspaceId);
      
      // Save workspace
      await this.saveWorkspace(workspace);
      
      // Register workspace
      this.workspaceRegistry.set(workspaceId, workspace);
      
      this.log(`[WORKSPACE] Created workspace: ${workspaceId} (${workspaceName})`);
      return workspace;
      
    } catch (error) {
      this.log(`[ERROR] Failed to create workspace: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Load workspace
   */
  async loadWorkspace(workspaceId) {
    try {
      if (!this.workspaceRegistry.has(workspaceId)) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }
      
      // Clear active memory
      await this.clearActiveMemory();
      
      // Load workspace data
      const workspace = await this.loadWorkspaceData(workspaceId);
      
      // Set as current workspace
      this.currentWorkspace = workspace;
      
      // Load workspace policy profile
      await this.loadWorkspacePolicy(workspace);
      
      // Load workspace strategy packs
      await this.loadWorkspaceStrategyPacks(workspace);
      
      // Log workspace change
      this.logAccess(workspaceId, 'workspace_loaded');
      
      this.log(`[WORKSPACE] Loaded workspace: ${workspaceId}`);
      return workspace;
      
    } catch (error) {
      this.log(`[ERROR] Failed to load workspace: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Save current workspace
   */
  async saveCurrentWorkspace() {
    if (!this.currentWorkspace) {
      throw new Error('No workspace currently loaded');
    }
    
    try {
      this.currentWorkspace.lastModified = new Date().toISOString();
      await this.saveWorkspace(this.currentWorkspace);
      
      // Update registry
      this.workspaceRegistry.set(this.currentWorkspace.id, this.currentWorkspace);
      
      this.log(`[WORKSPACE] Saved workspace: ${this.currentWorkspace.id}`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to save workspace: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Add artifact to workspace
   */
  async addArtifact(artifact) {
    if (!this.currentWorkspace) {
      throw new Error('No workspace currently loaded');
    }
    
    try {
      const artifactId = this.generateArtifactId();
      const workspaceArtifact = {
        id: artifactId,
        ...artifact,
        addedAt: new Date().toISOString(),
        workspaceId: this.currentWorkspace.id
      };
      
      // Add to workspace
      this.currentWorkspace.artifacts.push(workspaceArtifact);
      
      // Save workspace
      await this.saveCurrentWorkspace();
      
      this.log(`[WORKSPACE] Added artifact: ${artifactId} to workspace ${this.currentWorkspace.id}`);
      return workspaceArtifact;
      
    } catch (error) {
      this.log(`[ERROR] Failed to add artifact: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Add evidence log entry
   */
  async addEvidenceLog(entry) {
    if (!this.currentWorkspace) {
      throw new Error('No workspace currently loaded');
    }
    
    try {
      const logEntry = {
        id: this.generateLogId(),
        ...entry,
        timestamp: new Date().toISOString(),
        workspaceId: this.currentWorkspace.id
      };
      
      // Add to workspace
      this.currentWorkspace.evidenceLog.push(logEntry);
      
      // Save workspace
      await this.saveCurrentWorkspace();
      
      return logEntry;
    } catch (error) {
      this.log(`[ERROR] Failed to add evidence log: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Add export record
   */
  async addExportRecord(exportData) {
    if (!this.currentWorkspace) {
      throw new Error('No workspace currently loaded');
    }
    
    try {
      const exportRecord = {
        id: this.generateExportId(),
        ...exportData,
        exportedAt: new Date().toISOString(),
        workspaceId: this.currentWorkspace.id
      };
      
      // Add to workspace
      this.currentWorkspace.exportHistory.push(exportRecord);
      
      // Save workspace
      await this.saveCurrentWorkspace();
      
      this.log(`[WORKSPACE] Added export record: ${exportRecord.id}`);
      return exportRecord;
    } catch (error) {
      this.log(`[ERROR] Failed to add export record: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Get workspace list
   */
  getWorkspaceList() {
    return Array.from(this.workspaceRegistry.values()).map(workspace => ({
      id: workspace.id,
      name: workspace.name,
      caseNumber: workspace.caseNumber,
      caseType: workspace.caseType,
      classification: workspace.classification,
      assignedTo: workspace.assignedTo,
      status: workspace.status,
      role: workspace.role,
      createdAt: workspace.createdAt,
      lastModified: workspace.lastModified,
      artifactCount: workspace.artifacts.length,
      exportCount: workspace.exportHistory.length
    }));
  },
  
  /**
   * Get current workspace info
   */
  getCurrentWorkspace() {
    return this.currentWorkspace ? { ...this.currentWorkspace } : null;
  },
  
  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId) {
    try {
      if (workspaceId === this.currentWorkspace?.id) {
        throw new Error('Cannot delete currently loaded workspace');
      }
      
      if (!this.workspaceRegistry.has(workspaceId)) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }
      
      // Delete workspace directory
      await this.deleteWorkspaceDirectory(workspaceId);
      
      // Remove from registry
      this.workspaceRegistry.delete(workspaceId);
      
      this.log(`[WORKSPACE] Deleted workspace: ${workspaceId}`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to delete workspace: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Clear active memory
   */
  async clearActiveMemory() {
    try {
      // Clear current workspace
      this.currentWorkspace = null;
      
      // Clear strategy packs
      if (window.StrategyRuntime) {
        window.StrategyRuntime.clearCache();
      }
      
      // Clear evidence logger
      if (window.EvidenceLogger) {
        window.EvidenceLogger.clearLogs();
      }
      
      // Clear resurrection engine state
      if (window.ResurrectionEngine) {
        window.ResurrectionEngine.clearState();
      }
      
      this.log('[WORKSPACE] Active memory cleared');
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to clear active memory: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Load workspace policy profile
   */
  async loadWorkspacePolicy(workspace) {
    try {
      if (window.PolicyGuard) {
        window.PolicyGuard.setPolicy(workspace.policyProfile);
        this.log(`[WORKSPACE] Loaded policy profile: ${workspace.policyProfile}`);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to load workspace policy: ${error.message}`);
    }
  },
  
  /**
   * Load workspace strategy packs
   */
  async loadWorkspaceStrategyPacks(workspace) {
    try {
      if (window.StrategyRuntime) {
        for (const packInfo of workspace.loadedStrategyPacks) {
          await window.StrategyRuntime.loadStrategyPack(packInfo.path, packInfo.signature);
        }
        this.log(`[WORKSPACE] Loaded ${workspace.loadedStrategyPacks.length} strategy packs`);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to load workspace strategy packs: ${error.message}`);
    }
  },
  
  /**
   * Log workspace access
   */
  logAccess(workspaceId, action) {
    const accessEntry = {
      timestamp: new Date().toISOString(),
      workspaceId,
      action,
      user: this.getCurrentUser() || 'unknown'
    };
    
    if (this.currentWorkspace) {
      this.currentWorkspace.accessLog.push(accessEntry);
    }
    
    this.log(`[WORKSPACE] Access logged: ${action} on ${workspaceId}`);
  },
  
  // Helper methods
  generateWorkspaceId() {
    return `ws_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  },
  
  generateCaseNumber() {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 9999) + 1;
    return `CASE-${year}-${sequence.toString().padStart(4, '0')}`;
  },
  
  generateArtifactId() {
    return `art_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  },
  
  generateLogId() {
    return `log_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  },
  
  generateExportId() {
    return `exp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  },
  
  getCurrentUser() {
    // In a real implementation, this would get from auth system
    return window.hyper?.getCurrentUser?.() || 'analyst';
  },
  
  async ensureWorkspaceDirectory() {
    // Create workspaces directory if it doesn't exist
    if (window.hyper && window.hyper.ensureDirectory) {
      await window.hyper.ensureDirectory(this.workspacePath);
    }
  },
  
  async createWorkspaceDirectory(workspaceId) {
    const workspaceDir = `${this.workspacePath}/${workspaceId}`;
    if (window.hyper && window.hyper.ensureDirectory) {
      await window.hyper.ensureDirectory(workspaceDir);
    }
  },
  
  async deleteWorkspaceDirectory(workspaceId) {
    const workspaceDir = `${this.workspacePath}/${workspaceId}`;
    if (window.hyper && window.hyper.deleteDirectory) {
      await window.hyper.deleteDirectory(workspaceDir);
    }
  },
  
  async loadWorkspaceRegistry() {
    try {
      const registryPath = `${this.workspacePath}/registry.json`;
      if (window.hyper && window.hyper.fileExists) {
        if (await window.hyper.fileExists(registryPath)) {
          const registryData = await window.hyper.readFile(registryPath);
          const registry = JSON.parse(registryData);
          this.workspaceRegistry = new Map(Object.entries(registry));
        }
      }
    } catch (error) {
      this.log(`[WARNING] Failed to load workspace registry: ${error.message}`);
    }
  },
  
  async saveWorkspaceRegistry() {
    try {
      const registryPath = `${this.workspacePath}/registry.json`;
      const registryData = JSON.stringify(Object.fromEntries(this.workspaceRegistry), null, 2);
      if (window.hyper && window.hyper.saveFile) {
        await window.hyper.saveFile(registryPath, registryData);
      }
    } catch (error) {
      this.log(`[ERROR] Failed to save workspace registry: ${error.message}`);
    }
  },
  
  async saveWorkspace(workspace) {
    try {
      const workspacePath = `${this.workspacePath}/${workspace.id}/workspace.json`;
      const workspaceData = JSON.stringify(workspace, null, 2);
      if (window.hyper && window.hyper.saveFile) {
        await window.hyper.saveFile(workspacePath, workspaceData);
      }
      
      // Update registry
      await this.saveWorkspaceRegistry();
    } catch (error) {
      this.log(`[ERROR] Failed to save workspace: ${error.message}`);
      throw error;
    }
  },
  
  async loadWorkspaceData(workspaceId) {
    try {
      const workspacePath = `${this.workspacePath}/${workspaceId}/workspace.json`;
      if (window.hyper && window.hyper.readFile) {
        const workspaceData = await window.hyper.readFile(workspacePath);
        return JSON.parse(workspaceData);
      }
      throw new Error('Workspace data file not found');
    } catch (error) {
      this.log(`[ERROR] Failed to load workspace data: ${error.message}`);
      throw error;
    }
  },
  
  log(message) {
    console.log(`[WORKSPACE_MANAGER] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkspaceManager;
} else {
  window.WorkspaceManager = WorkspaceManager;
}
