/**
 * Enterprise Manager
 * Provides enterprise profile mode with strict enforcement and compliance
 */

const EnterpriseManager = {
  // Module metadata
  name: 'enterprise_manager',
  version: '1.0.0',
  description: 'Enterprise profile mode with strict enforcement and compliance',
  
  // State
  initialized = false,
  enterpriseMode = false,
  complianceSettings = {},
  
  // Enterprise policy configuration
  enterprisePolicy = {
    // Security settings
    airgapEnforced: true,
    strictModeOnly: true,
    signedImportsRequired: true,
    
    // Audit settings
    auditLogsImmutable: true,
    exportLoggingMandatory: true,
    sessionRecording: true,
    
    // Access control
    roleEnforcement: true,
    workspaceIsolation: true,
    multiFactorRequired: false,
    
    // Data protection
    dataEncryption: true,
    secureDelete: true,
    backupRequired: true,
    
    // Compliance
    complianceReporting: true,
    policyVersioning: true,
    changeManagement: true,
    
    // Restrictions
    noLabMode: true,
    noDebugConsole: true,
    noUnsignedCode: true,
    noExternalConnections: true
  },
  
  /**
   * Initialize enterprise manager
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load enterprise configuration
      await this.loadEnterpriseConfig();
      
      // Check if enterprise mode should be enabled
      await this.checkEnterpriseMode();
      
      this.initialized = true;
      this.log('[ENTERPRISE] Enterprise manager initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Enterprise manager initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Enable enterprise mode
   */
  async enableEnterpriseMode() {
    try {
      // Validate enterprise requirements
      await this.validateEnterpriseRequirements();
      
      // Apply enterprise policies
      await this.applyEnterprisePolicies();
      
      // Set enterprise mode flag
      this.enterpriseMode = true;
      
      // Update UI
      this.updateEnterpriseUI();
      
      // Log enterprise mode activation
      await this.logEnterpriseEvent('ENTERPRISE_MODE_ENABLED', {
        timestamp: new Date().toISOString(),
        user: this.getCurrentUser(),
        policyVersion: this.getCurrentPolicyVersion()
      });
      
      this.log('[ENTERPRISE] Enterprise mode enabled');
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to enable enterprise mode: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Disable enterprise mode
   */
  async disableEnterpriseMode() {
    try {
      // Check if disable is allowed
      if (!this.canDisableEnterpriseMode()) {
        throw new Error('Enterprise mode cannot be disabled in current configuration');
      }
      
      // Remove enterprise restrictions
      await this.removeEnterprisePolicies();
      
      // Clear enterprise mode flag
      this.enterpriseMode = false;
      
      // Update UI
      this.updateEnterpriseUI();
      
      // Log enterprise mode deactivation
      await this.logEnterpriseEvent('ENTERPRISE_MODE_DISABLED', {
        timestamp: new Date().toISOString(),
        user: this.getCurrentUser()
      });
      
      this.log('[ENTERPRISE] Enterprise mode disabled');
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to disable enterprise mode: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Check if enterprise mode is active
   */
  isEnterpriseMode() {
    return this.enterpriseMode;
  },
  
  /**
   * Validate enterprise requirements
   */
  async validateEnterpriseRequirements() {
    const requirements = [
      { check: () => this.validateAirgapRequirement(), message: 'Airgap mode required' },
      { check: () => this.validateRoleRequirements(), message: 'Proper role configuration required' },
      { check: () => this.validateWorkspaceRequirements(), message: 'Workspace isolation required' },
      { check: () => this.validateSecurityRequirements(), message: 'Security requirements not met' },
      { check: () => this.validateAuditRequirements(), message: 'Audit requirements not met' }
    ];
    
    for (const requirement of requirements) {
      if (!await requirement.check()) {
        throw new Error(requirement.message);
      }
    }
    
    return true;
  },
  
  /**
   * Apply enterprise policies
   */
  async applyEnterprisePolicies() {
    try {
      // Force strict policy mode
      if (window.PolicyGuard) {
        window.PolicyGuard.setPolicy('strict');
        window.PolicyGuard.requireSignedImport = true;
      }
      
      // Force airgap mode
      if (window.AirgapGuard) {
        window.AirgapGuard.enable();
      }
      
      // Enable release mode
      if (window.UI) {
        window.UI.toggleReleaseMode(true);
      }
      
      // Apply role restrictions
      if (window.RoleManager) {
        await window.RoleManager.applyRoleRestrictions();
      }
      
      // Enable audit logging
      if (window.EvidenceLogger) {
        window.EvidenceLogger.enableImmutableMode();
      }
      
      // Disable restricted features
      this.disableRestrictedFeatures();
      
      this.log('[ENTERPRISE] Enterprise policies applied');
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to apply enterprise policies: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Remove enterprise policies
   */
  async removeEnterprisePolicies() {
    try {
      // Restore normal policy mode
      if (window.PolicyGuard) {
        const role = window.RoleManager?.getCurrentRole();
        if (role) {
          window.PolicyGuard.setPolicy(role.policy);
        }
      }
      
      // Enable restricted features
      this.enableRestrictedFeatures();
      
      this.log('[ENTERPRISE] Enterprise policies removed');
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to remove enterprise policies: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Disable restricted features in enterprise mode
   */
  disableRestrictedFeatures() {
    const restrictedFeatures = [
      'labModeToggle',
      'debugConsole',
      'unsignedPackUpload',
      'policyOverride',
      'networkSettings',
      'developerTools'
    ];
    
    restrictedFeatures.forEach(featureId => {
      const element = document.getElementById(featureId);
      if (element) {
        element.disabled = true;
        element.style.display = 'none';
        element.title = 'Feature disabled in enterprise mode';
      }
    });
  },
  
  /**
   * Enable restricted features when leaving enterprise mode
   */
  enableRestrictedFeatures() {
    const restrictedFeatures = [
      'labModeToggle',
      'debugConsole',
      'unsignedPackUpload',
      'policyOverride',
      'networkSettings',
      'developerTools'
    ];
    
    restrictedFeatures.forEach(featureId => {
      const element = document.getElementById(featureId);
      if (element) {
        element.disabled = false;
        element.style.display = '';
        element.title = '';
      }
    });
  },
  
  /**
   * Update enterprise UI
   */
  updateEnterpriseUI() {
    const enterpriseBadge = document.getElementById('enterpriseBadge');
    if (enterpriseBadge) {
      if (this.enterpriseMode) {
        enterpriseBadge.style.display = 'block';
        enterpriseBadge.textContent = 'ENTERPRISE PROFILE ACTIVE';
        enterpriseBadge.className = 'enterprise-badge active';
      } else {
        enterpriseBadge.style.display = 'none';
      }
    }
    
    // Update system info
    this.updateSystemInfo();
  },
  
  /**
   * Validate airgap requirement
   */
  async validateAirgapRequirement() {
    if (window.AirgapGuard) {
      return window.AirgapGuard.isEnabled();
    }
    return false;
  },
  
  /**
   * Validate role requirements
   */
  async validateRoleRequirements() {
    if (window.RoleManager) {
      const currentRole = window.RoleManager.getCurrentRole();
      return currentRole && ['FOUNDER', 'AUDITOR', 'ENTERPRISE'].includes(currentRole.name);
    }
    return false;
  },
  
  /**
   * Validate workspace requirements
   */
  async validateWorkspaceRequirements() {
    if (window.WorkspaceManager) {
      return window.WorkspaceManager.getCurrentWorkspace() !== null;
    }
    return false;
  },
  
  /**
   * Validate security requirements
   */
  async validateSecurityRequirements() {
    // Check manifest integrity
    if (window.hyper && window.hyper.verifyManifest) {
      try {
        return await window.hyper.verifyManifest();
      } catch {
        return false;
      }
    }
    return false;
  },
  
  /**
   * Validate audit requirements
   */
  async validateAuditRequirements() {
    if (window.EvidenceLogger) {
      return window.EvidenceLogger.isInitialized();
    }
    return false;
  },
  
  /**
   * Check if enterprise mode can be disabled
   */
  canDisableEnterpriseMode() {
    // In a real implementation, this would check organizational policies
    // For now, we'll allow it only for Founder role
    if (window.RoleManager) {
      const currentRole = window.RoleManager.getCurrentRole();
      return currentRole && currentRole.name === 'FOUNDER';
    }
    return false;
  },
  
  /**
   * Log enterprise event
   */
  async logEnterpriseEvent(eventType, data) {
    try {
      const logEntry = {
        eventType,
        timestamp: new Date().toISOString(),
        enterpriseMode: this.enterpriseMode,
        ...data
      };
      
      if (window.EvidenceLogger) {
        await window.EvidenceLogger.addEvidenceLog({
          type: 'enterprise',
          event: eventType,
          data: logEntry
        });
      }
      
      // Also log to main process if available
      if (window.hyper && window.hyper.logEnterpriseEvent) {
        await window.hyper.logEnterpriseEvent(logEntry);
      }
      
    } catch (error) {
      this.log(`[ERROR] Failed to log enterprise event: ${error.message}`);
    }
  },
  
  /**
   * Generate enterprise compliance report
   */
  async generateComplianceReport() {
    try {
      const report = {
        reportType: 'enterprise_compliance',
        generatedAt: new Date().toISOString(),
        enterpriseMode: this.enterpriseMode,
        policyVersion: this.getCurrentPolicyVersion(),
        complianceStatus: await this.getComplianceStatus(),
        auditSummary: await this.getAuditSummary(),
        securityPosture: await this.getSecurityPosture(),
        recommendations: await this.getComplianceRecommendations()
      };
      
      return report;
    } catch (error) {
      this.log(`[ERROR] Failed to generate compliance report: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Get compliance status
   */
  async getComplianceStatus() {
    const checks = [
      { name: 'Airgap Enforced', status: this.validateAirgapRequirement() },
      { name: 'Strict Mode Only', status: this.enterprisePolicy.strictModeOnly },
      { name: 'Signed Imports Required', status: this.enterprisePolicy.signedImportsRequired },
      { name: 'Audit Logs Immutable', status: this.enterprisePolicy.auditLogsImmutable },
      { name: 'Export Logging Mandatory', status: this.enterprisePolicy.exportLoggingMandatory },
      { name: 'Role Enforcement', status: this.enterprisePolicy.roleEnforcement },
      { name: 'Workspace Isolation', status: this.enterprisePolicy.workspaceIsolation }
    ];
    
    const passed = checks.filter(check => check.status).length;
    const total = checks.length;
    
    return {
      overall: passed === total ? 'COMPLIANT' : 'NON_COMPLIANT',
      score: (passed / total) * 100,
      checks
    };
  },
  
  /**
   * Get audit summary
   */
  async getAuditSummary() {
    if (window.EvidenceLogger) {
      const stats = window.EvidenceLogger.getStatistics();
      return {
        totalEntries: stats.totalEntries,
        sessionDuration: stats.sessionDuration,
        logLevel: stats.currentLogLevel,
        persistenceEnabled: stats.persistenceEnabled
      };
    }
    return null;
  },
  
  /**
   * Get security posture
   */
  async getSecurityPosture() {
    return {
      airgapActive: this.validateAirgapRequirement(),
      manifestVerified: await this.validateSecurityRequirements(),
      roleEnforced: this.validateRoleRequirements(),
      workspaceIsolated: this.validateWorkspaceRequirements(),
      auditEnabled: this.validateAuditRequirements(),
      enterpriseMode: this.enterpriseMode
    };
  },
  
  /**
   * Get compliance recommendations
   */
  async getComplianceRecommendations() {
    const recommendations = [];
    
    if (!await this.validateAirgapRequirement()) {
      recommendations.push('Enable airgap mode for maximum security');
    }
    
    if (!await this.validateRoleRequirements()) {
      recommendations.push('Configure proper role-based access control');
    }
    
    if (!await this.validateWorkspaceRequirements()) {
      recommendations.push('Activate workspace isolation for data separation');
    }
    
    if (!await this.validateSecurityRequirements()) {
      recommendations.push('Verify manifest integrity for security assurance');
    }
    
    if (!await this.validateAuditRequirements()) {
      recommendations.push('Enable comprehensive audit logging');
    }
    
    return recommendations;
  },
  
  /**
   * Load enterprise configuration
   */
  async loadEnterpriseConfig() {
    try {
      // In a real implementation, this would load from configuration file
      // For now, we'll use default enterprise policy
      this.complianceSettings = { ...this.enterprisePolicy };
    } catch (error) {
      this.log(`[WARNING] Failed to load enterprise config: ${error.message}`);
      this.complianceSettings = { ...this.enterprisePolicy };
    }
  },
  
  /**
   * Check enterprise mode
   */
  async checkEnterpriseMode() {
    try {
      // Check if enterprise mode should be enabled based on configuration
      const shouldEnable = this.complianceSettings.enterpriseMode || false;
      
      if (shouldEnable) {
        await this.enableEnterpriseMode();
      }
    } catch (error) {
      this.log(`[WARNING] Failed to check enterprise mode: ${error.message}`);
    }
  },
  
  /**
   * Update system info
   */
  updateSystemInfo() {
    const systemInfo = document.getElementById('systemInfo');
    if (systemInfo) {
      const enterpriseStatus = this.enterpriseMode ? 'ENTERPRISE' : 'STANDARD';
      systemInfo.innerHTML = systemInfo.innerHTML.replace(
        /RUNTIME: [^<]+/,
        `RUNTIME: ${enterpriseStatus} ELECTRON AIRGAPPED`
      );
    }
  },
  
  /**
   * Get current policy version
   */
  getCurrentPolicyVersion() {
    return 'CASH-SHIELD-01';
  },
  
  /**
   * Get current user
   */
  getCurrentUser() {
    return window.RoleManager?.getCurrentUser() || 'unknown';
  },
  
  /**
   * Log enterprise manager events
   */
  log(message) {
    console.log(`[ENTERPRISE_MANAGER] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnterpriseManager;
} else {
  window.EnterpriseManager = EnterpriseManager;
}
