/**
 * Role Manager
 * Provides role-based policy control and access management
 */

const RoleManager = {
  // Module metadata
  name: 'role_manager',
  version: '1.0.0',
  description: 'Role-based policy control and access management system',
  
  // State
  initialized: false,
  currentRole = null,
  currentUser = null,
  
  // Role definitions
  roles: {
    FOUNDER: {
      name: 'Founder',
      level: 100,
      permissions: {
        // Policy control
        canChangePolicy: true,
        canOverridePolicy: true,
        canAccessAllTiers: true,
        
        // Workspace management
        canCreateWorkspaces: true,
        canDeleteWorkspaces: true,
        canAccessAllWorkspaces: true,
        
        // Strategy packs
        canLoadUnsignedPacks: true,
        canCreatePacks: true,
        canAccessExperimental: true,
        
        // Export control
        canExportAll: true,
        canBypassExportRestrictions: true,
        
        // System control
        canToggleLabMode: true,
        canToggleReleaseMode: true,
        canAccessDebugConsole: true,
        canViewSystemLogs: true,
        
        // Enterprise features
        canManageEnterprise: true,
        canModifySecuritySettings: true
      },
      defaultPolicy: 'permissive',
      defaultTier: 'TIER_5',
      uiCapabilities: ['all']
    },
    
    ANALYST: {
      name: 'Analyst',
      level: 50,
      permissions: {
        // Policy control
        canChangePolicy: false,
        canOverridePolicy: false,
        canAccessAllTiers: false,
        
        // Workspace management
        canCreateWorkspaces: true,
        canDeleteWorkspaces: false,
        canAccessAllWorkspaces: false,
        
        // Strategy packs
        canLoadUnsignedPacks: false,
        canCreatePacks: false,
        canAccessExperimental: false,
        
        // Export control
        canExportAll: true,
        canBypassExportRestrictions: false,
        
        // System control
        canToggleLabMode: false,
        canToggleReleaseMode: false,
        canAccessDebugConsole: false,
        canViewSystemLogs: true,
        
        // Enterprise features
        canManageEnterprise: false,
        canModifySecuritySettings: false
      },
      defaultPolicy: 'standard',
      defaultTier: 'TIER_3',
      uiCapabilities: ['resurrection', 'evidence', 'workspaces', 'reports']
    },
    
    AUDITOR: {
      name: 'Auditor',
      level: 75,
      permissions: {
        // Policy control
        canChangePolicy: false,
        canOverridePolicy: false,
        canAccessAllTiers: true,
        
        // Workspace management
        canCreateWorkspaces: false,
        canDeleteWorkspaces: false,
        canAccessAllWorkspaces: true,
        
        // Strategy packs
        canLoadUnsignedPacks: false,
        canCreatePacks: false,
        canAccessExperimental: false,
        
        // Export control
        canExportAll: true,
        canBypassExportRestrictions: false,
        
        // System control
        canToggleLabMode: false,
        canToggleReleaseMode: false,
        canAccessDebugConsole: false,
        canViewSystemLogs: true,
        
        // Enterprise features
        canManageEnterprise: false,
        canModifySecuritySettings: false
      },
      defaultPolicy: 'strict',
      defaultTier: 'TIER_4',
      uiCapabilities: ['resurrection', 'evidence', 'workspaces', 'reports', 'audit']
    },
    
    ENTERPRISE: {
      name: 'Enterprise',
      level: 60,
      permissions: {
        // Policy control
        canChangePolicy: false,
        canOverridePolicy: false,
        canAccessAllTiers: false,
        
        // Workspace management
        canCreateWorkspaces: true,
        canDeleteWorkspaces: false,
        canAccessAllWorkspaces: false,
        
        // Strategy packs
        canLoadUnsignedPacks: false,
        canCreatePacks: false,
        canAccessExperimental: false,
        
        // Export control
        canExportAll: false,
        canBypassExportRestrictions: false,
        
        // System control
        canToggleLabMode: false,
        canToggleReleaseMode: false,
        canAccessDebugConsole: false,
        canViewSystemLogs: false,
        
        // Enterprise features
        canManageEnterprise: false,
        canModifySecuritySettings: false
      },
      defaultPolicy: 'strict',
      defaultTier: 'TIER_2',
      uiCapabilities: ['resurrection', 'evidence', 'workspaces']
    }
  },
  
  /**
   * Initialize role manager
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load current user and role
      await this.loadCurrentUser();
      
      this.initialized = true;
      this.log('[ROLE] Role manager initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Role manager initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Set current role
   */
  async setRole(roleName, userId = null) {
    try {
      const role = this.roles[roleName];
      if (!role) {
        throw new Error(`Invalid role: ${roleName}`);
      }
      
      this.currentRole = role;
      this.currentUser = userId || this.getCurrentUser();
      
      // Apply role restrictions
      await this.applyRoleRestrictions();
      
      // Log role change
      this.log(`[ROLE] Role changed to: ${roleName} for user: ${this.currentUser}`);
      
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to set role: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Check permission
   */
  hasPermission(permission) {
    if (!this.currentRole) {
      return false;
    }
    
    return this.currentRole.permissions[permission] === true;
  },
  
  /**
   * Check access to tier
   */
  canAccessTier(tierName) {
    if (!this.currentRole) {
      return false;
    }
    
    if (this.currentRole.permissions.canAccessAllTiers) {
      return true;
    }
    
    const tierLevels = {
      'TIER_1': 10,
      'TIER_2': 20,
      'TIER_3': 30,
      'TIER_4': 40,
      'TIER_5': 50
    };
    
    const requiredLevel = tierLevels[tierName] || 0;
    const roleTierLevel = tierLevels[this.currentRole.defaultTier] || 0;
    
    return roleTierLevel >= requiredLevel;
  },
  
  /**
   * Check if UI capability is allowed
   */
  canAccessCapability(capability) {
    if (!this.currentRole) {
      return false;
    }
    
    return this.currentRole.uiCapabilities.includes('all') ||
           this.currentRole.uiCapabilities.includes(capability);
  },
  
  /**
   * Get current role info
   */
  getCurrentRole() {
    return this.currentRole ? {
      name: this.currentRole.name,
      level: this.currentRole.level,
      policy: this.currentRole.defaultPolicy,
      tier: this.currentRole.defaultTier,
      permissions: { ...this.currentRole.permissions }
    } : null;
  },
  
  /**
   * Get all available roles
   */
  getAvailableRoles() {
    return Object.keys(this.roles).map(roleKey => ({
      key: roleKey,
      name: this.roles[roleKey].name,
      level: this.roles[roleKey].level,
      description: this.getRoleDescription(roleKey)
    }));
  },
  
  /**
   * Apply role restrictions to UI
   */
  async applyRoleRestrictions() {
    try {
      // Apply policy restrictions
      if (window.PolicyGuard) {
        window.PolicyGuard.setPolicy(this.currentRole.defaultPolicy);
      }
      
      // Apply UI restrictions
      this.applyUIRestrictions();
      
      // Apply feature restrictions
      this.applyFeatureRestrictions();
      
    } catch (error) {
      this.log(`[ERROR] Failed to apply role restrictions: ${error.message}`);
    }
  },
  
  /**
   * Apply UI restrictions
   */
  applyUIRestrictions() {
    // Hide/show UI elements based on role
    const elements = {
      'labModeToggle': this.hasPermission('canToggleLabMode'),
      'releaseModeToggle': this.hasPermission('canToggleReleaseMode'),
      'debugConsole': this.hasPermission('canAccessDebugConsole'),
      'systemLogs': this.hasPermission('canViewSystemLogs'),
      'enterpriseSettings': this.hasPermission('canManageEnterprise'),
      'unsignedPackUpload': this.hasPermission('canLoadUnsignedPacks'),
      'workspaceDelete': this.hasPermission('canDeleteWorkspaces'),
      'policyOverride': this.hasPermission('canOverridePolicy')
    };
    
    Object.entries(elements).forEach(([elementId, allowed]) => {
      const element = document.getElementById(elementId);
      if (element) {
        if (allowed) {
          element.style.display = '';
          element.disabled = false;
        } else {
          element.style.display = 'none';
          element.disabled = true;
        }
      }
    });
    
    // Update role indicator
    this.updateRoleIndicator();
  },
  
  /**
   * Apply feature restrictions
   */
  applyFeatureRestrictions() {
    // Restrict strategy pack loading
    if (!this.hasPermission('canLoadUnsignedPacks')) {
      // Enable signed import requirement
      if (window.PolicyGuard) {
        window.PolicyGuard.requireSignedImport = true;
      }
    }
    
    // Restrict export capabilities
    if (!this.hasPermission('canExportAll')) {
      // Apply export restrictions
      if (window.PolicyGuard) {
        window.PolicyGuard.exportRestricted = true;
      }
    }
    
    // Restrict workspace operations
    if (!this.hasPermission('canCreateWorkspaces')) {
      // Disable workspace creation
      const createButton = document.getElementById('createWorkspaceBtn');
      if (createButton) {
        createButton.disabled = true;
      }
    }
  },
  
  /**
   * Update role indicator in UI
   */
  updateRoleIndicator() {
    const roleIndicator = document.getElementById('roleIndicator');
    if (roleIndicator && this.currentRole) {
      roleIndicator.textContent = `Role: ${this.currentRole.name}`;
      roleIndicator.className = `role-indicator role-${this.currentRole.name.toLowerCase()}`;
    }
  },
  
  /**
   * Validate action against role permissions
   */
  validateAction(action, context = {}) {
    const permission = this.getActionPermission(action);
    
    if (!this.hasPermission(permission)) {
      throw new Error(`Action not permitted: ${action} (requires ${permission})`);
    }
    
    // Additional context-based validation
    if (action === 'deleteWorkspace' && context.workspaceId) {
      // Check if user owns the workspace or has admin access
      if (!this.canAccessWorkspace(context.workspaceId)) {
        throw new Error('Cannot delete workspace: insufficient permissions');
      }
    }
    
    return true;
  },
  
  /**
   * Get permission required for action
   */
  getActionPermission(action) {
    const actionPermissions = {
      'changePolicy': 'canChangePolicy',
      'overridePolicy': 'canOverridePolicy',
      'createWorkspace': 'canCreateWorkspaces',
      'deleteWorkspace': 'canDeleteWorkspaces',
      'loadUnsignedPack': 'canLoadUnsignedPacks',
      'createStrategyPack': 'canCreatePacks',
      'accessExperimental': 'canAccessExperimental',
      'exportAll': 'canExportAll',
      'bypassExportRestrictions': 'canBypassExportRestrictions',
      'toggleLabMode': 'canToggleLabMode',
      'toggleReleaseMode': 'canToggleReleaseMode',
      'accessDebugConsole': 'canAccessDebugConsole',
      'viewSystemLogs': 'canViewSystemLogs',
      'manageEnterprise': 'canManageEnterprise',
      'modifySecuritySettings': 'canModifySecuritySettings'
    };
    
    return actionPermissions[action] || null;
  },
  
  /**
   * Check if user can access workspace
   */
  canAccessWorkspace(workspaceId) {
    if (this.hasPermission('canAccessAllWorkspaces')) {
      return true;
    }
    
    // In a real implementation, this would check workspace ownership
    return false;
  },
  
  /**
   * Get role description
   */
  getRoleDescription(roleKey) {
    const descriptions = {
      'FOUNDER': 'Full system access with all capabilities and overrides',
      'ANALYST': 'Standard analysis capabilities with workspace management',
      'AUDITOR': 'Read-only access to all workspaces with audit capabilities',
      'ENTERPRISE': 'Restricted access for enterprise environments with compliance focus'
    };
    
    return descriptions[roleKey] || 'No description available';
  },
  
  /**
   * Load current user
   */
  async loadCurrentUser() {
    try {
      // In a real implementation, this would load from authentication system
      this.currentUser = window.hyper?.getCurrentUser?.() || 'analyst';
      
      // Set default role based on user
      const defaultRole = this.getDefaultRoleForUser(this.currentUser);
      await this.setRole(defaultRole, this.currentUser);
      
    } catch (error) {
      this.log(`[WARNING] Failed to load current user: ${error.message}`);
      // Set default role
      await this.setRole('ANALYST', 'default');
    }
  },
  
  /**
   * Get default role for user
   */
  getDefaultRoleForUser(userId) {
    // In a real implementation, this would check user profile
    if (userId === 'founder' || userId.includes('admin')) {
      return 'FOUNDER';
    } else if (userId.includes('auditor')) {
      return 'AUDITOR';
    } else if (userId.includes('enterprise')) {
      return 'ENTERPRISE';
    }
    return 'ANALYST';
  },
  
  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  },
  
  /**
   * Log role manager events
   */
  log(message) {
    console.log(`[ROLE_MANAGER] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoleManager;
} else {
  window.RoleManager = RoleManager;
}
