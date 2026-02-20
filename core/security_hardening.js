/**
 * Security Hardening Layer
 * Provides tamper detection, runtime integrity checks, and security enforcement
 */

const SecurityHardening = {
  // Module metadata
  name: 'security_hardening',
  version: '1.0.0',
  description: 'Security hardening layer with tamper detection and runtime integrity',
  
  // State
  initialized = false,
  integrityChecked = false,
  tamperDetected = false,
  lockdownMode = false,
  securityMetrics = {
    integrityChecks: 0,
    tamperAttempts: 0,
    securityViolations: 0,
    lastIntegrityCheck: null
  },
  
  // Security configuration
  securityConfig = {
    // Integrity checking
    enableIntegrityChecks: true,
    integrityCheckInterval: 30000, // 30 seconds
    criticalModules: [
      'resurrection_core',
      'policy_guard',
      'evidence_logger',
      'role_manager',
      'enterprise_manager'
    ],
    
    // Tamper detection
    enableTamperDetection: true,
    tamperThreshold: 3, // Max violations before lockdown
    
    // Runtime security
    enableRuntimeProtection: true,
    blockDevTools: true,
    blockConsoleAccess: true,
    blockExternalScripts: true,
    
    // Memory protection
    enableMemoryProtection: true,
    memoryCheckInterval: 60000, // 1 minute
    
    // Audit logging
    enableSecurityAudit: true,
    logAllSecurityEvents: true
  },
  
  // Known good hashes (would be loaded from secure storage)
  knownHashes: new Map(),
  
  /**
   * Initialize security hardening
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load known good hashes
      await this.loadKnownHashes();
      
      // Perform initial integrity check
      await this.performIntegrityCheck();
      
      // Start continuous monitoring
      await this.startSecurityMonitoring();
      
      // Apply runtime protections
      await this.applyRuntimeProtections();
      
      this.initialized = true;
      this.log('[SECURITY] Security hardening initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Security hardening initialization failed: ${error.message}`);
      await this.triggerLockdown('Initialization failed');
      return false;
    }
  },
  
  /**
   * Perform integrity check
   */
  async performIntegrityCheck() {
    try {
      if (!this.securityConfig.enableIntegrityChecks) {
        return true;
      }
      
      this.securityMetrics.integrityChecks++;
      this.securityMetrics.lastIntegrityCheck = new Date().toISOString();
      
      const violations = [];
      
      // Check critical modules
      for (const moduleName of this.securityConfig.criticalModules) {
        const violation = await this.checkModuleIntegrity(moduleName);
        if (violation) {
          violations.push(violation);
        }
      }
      
      // Check manifest integrity
      const manifestViolation = await this.checkManifestIntegrity();
      if (manifestViolation) {
        violations.push(manifestViolation);
      }
      
      // Check runtime environment
      const runtimeViolation = await this.checkRuntimeIntegrity();
      if (runtimeViolation) {
        violations.push(runtimeViolation);
      }
      
      if (violations.length > 0) {
        await this.handleIntegrityViolation(violations);
        return false;
      }
      
      this.integrityChecked = true;
      this.log('[SECURITY] Integrity check passed');
      return true;
    } catch (error) {
      this.log(`[ERROR] Integrity check failed: ${error.message}`);
      await this.triggerLockdown('Integrity check error');
      return false;
    }
  },
  
  /**
   * Check module integrity
   */
  async checkModuleIntegrity(moduleName) {
    try {
      const module = window[moduleName];
      if (!module) {
        return {
          type: 'missing_module',
          module: moduleName,
          severity: 'critical',
          message: `Critical module missing: ${moduleName}`
        };
      }
      
      // Check module hash if available
      if (this.knownHashes.has(moduleName)) {
        const currentHash = this.calculateModuleHash(module);
        const expectedHash = this.knownHashes.get(moduleName);
        
        if (currentHash !== expectedHash) {
          return {
            type: 'hash_mismatch',
            module: moduleName,
            severity: 'critical',
            message: `Module hash mismatch: ${moduleName}`,
            expected: expectedHash,
            actual: currentHash
          };
        }
      }
      
      // Check module structure
      const structureViolation = this.checkModuleStructure(module, moduleName);
      if (structureViolation) {
        return structureViolation;
      }
      
      return null;
    } catch (error) {
      return {
        type: 'check_error',
        module: moduleName,
        severity: 'high',
        message: `Module check error: ${error.message}`
      };
    }
  },
  
  /**
   * Check manifest integrity
   */
  async checkManifestIntegrity() {
    try {
      if (window.hyper && window.hyper.verifyManifest) {
        const manifestValid = await window.hyper.verifyManifest();
        if (!manifestValid) {
          return {
            type: 'manifest_invalid',
            severity: 'critical',
            message: 'Manifest verification failed'
          };
        }
      }
      
      return null;
    } catch (error) {
      return {
        type: 'manifest_error',
        severity: 'high',
        message: `Manifest check error: ${error.message}`
      };
    }
  },
  
  /**
   * Check runtime integrity
   */
  async checkRuntimeIntegrity() {
    const violations = [];
    
    // Check for debug mode
    if (this.isDebugMode()) {
      violations.push({
        type: 'debug_mode',
        severity: 'medium',
        message: 'Debug mode detected'
      });
    }
    
    // Check for dev tools
    if (this.isDevToolsOpen()) {
      violations.push({
        type: 'dev_tools',
        severity: 'high',
        message: 'Developer tools detected'
      });
    }
    
    // Check for console access
    if (this.hasConsoleAccess()) {
      violations.push({
        type: 'console_access',
        severity: 'medium',
        message: 'Console access detected'
      });
    }
    
    // Check for external scripts
    if (this.hasExternalScripts()) {
      violations.push({
        type: 'external_scripts',
        severity: 'critical',
        message: 'External scripts detected'
      });
    }
    
    return violations.length > 0 ? violations : null;
  },
  
  /**
   * Handle integrity violation
   */
  async handleIntegrityViolation(violations) {
    try {
      this.securityMetrics.securityViolations += violations.length;
      
      // Log violations
      for (const violation of violations) {
        await this.logSecurityEvent('INTEGRITY_VIOLATION', violation);
      }
      
      // Check if lockdown should be triggered
      const criticalViolations = violations.filter(v => v.severity === 'critical');
      if (criticalViolations.length > 0 || this.securityMetrics.securityViolations >= this.securityConfig.tamperThreshold) {
        await this.triggerLockdown('Critical integrity violations detected');
        return;
      }
      
      // Apply mitigations
      await this.applySecurityMitigations(violations);
      
    } catch (error) {
      this.log(`[ERROR] Failed to handle integrity violation: ${error.message}`);
      await this.triggerLockdown('Violation handling failed');
    }
  },
  
  /**
   * Trigger security lockdown
   */
  async triggerLockdown(reason) {
    try {
      this.lockdownMode = true;
      this.tamperDetected = true;
      
      // Log lockdown event
      await this.logSecurityEvent('LOCKDOWN_TRIGGERED', { reason });
      
      // Disable all functionality
      this.disableAllFunctionality();
      
      // Show lockdown message
      this.showLockdownMessage(reason);
      
      // Notify main process
      if (window.hyper && window.hyper.triggerLockdown) {
        await window.hyper.triggerLockdown(reason);
      }
      
      this.log(`[SECURITY] LOCKDOWN TRIGGERED: ${reason}`);
    } catch (error) {
      this.log(`[ERROR] Lockdown failed: ${error.message}`);
    }
  },
  
  /**
   * Apply runtime protections
   */
  async applyRuntimeProtections() {
    try {
      if (this.securityConfig.blockDevTools) {
        this.blockDevTools();
      }
      
      if (this.securityConfig.blockConsoleAccess) {
        this.blockConsoleAccess();
      }
      
      if (this.securityConfig.blockExternalScripts) {
        this.blockExternalScripts();
      }
      
      if (this.securityConfig.enableMemoryProtection) {
        this.enableMemoryProtection();
      }
      
      this.log('[SECURITY] Runtime protections applied');
    } catch (error) {
      this.log(`[ERROR] Failed to apply runtime protections: ${error.message}`);
    }
  },
  
  /**
   * Block developer tools
   */
  blockDevTools() {
    // Block DevTools opening
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        this.logSecurityEvent('DEV_TOOLS_BLOCKED', { key: e.key });
      }
    });
    
    // Block right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // Detect DevTools via console size
    const detectDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        this.logSecurityEvent('DEV_TOOLS_DETECTED', { 
          outerHeight: window.outerHeight,
          innerHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          innerWidth: window.innerWidth
        });
        
        if (this.securityConfig.enableTamperDetection) {
          this.triggerLockdown('Developer tools detected');
        }
      }
    };
    
    setInterval(detectDevTools, 1000);
  },
  
  /**
   * Block console access
   */
  blockConsoleAccess() {
    const originalConsole = { ...console };
    
    // Override console methods in release mode
    if (window.UI && window.UI.state && window.UI.state.releaseMode) {
      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.debug = () => {};
    }
    
    // Detect console access attempts
    Object.defineProperty(window, 'console', {
      get: () => {
        this.logSecurityEvent('CONSOLE_ACCESS', { stack: new Error().stack });
        return originalConsole;
      },
      set: () => {
        this.logSecurityEvent('CONSOLE_MODIFICATION', { stack: new Error().stack });
      }
    });
  },
  
  /**
   * Block external scripts
   */
  blockExternalScripts() {
    // Monitor for new script elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT' && node.src && !node.src.startsWith('file://')) {
            this.logSecurityEvent('EXTERNAL_SCRIPT', { src: node.src });
            node.remove();
            
            if (this.securityConfig.enableTamperDetection) {
              this.triggerLockdown('External script detected');
            }
          }
        });
      });
    });
    
    observer.observe(document.head, { childList: true, subtree: true });
  },
  
  /**
   * Enable memory protection
   */
  enableMemoryProtection() {
    // Monitor memory usage
    const checkMemory = () => {
      if (performance && performance.memory) {
        const memory = performance.memory;
        const usedMemory = memory.usedJSHeapSize;
        const totalMemory = memory.totalJSHeapSize;
        const memoryUsage = usedMemory / totalMemory;
        
        if (memoryUsage > 0.9) {
          this.logSecurityEvent('HIGH_MEMORY_USAGE', {
            used: usedMemory,
            total: totalMemory,
            usage: memoryUsage
          });
        }
      }
    };
    
    setInterval(checkMemory, this.securityConfig.memoryCheckInterval);
  },
  
  /**
   * Start security monitoring
   */
  async startSecurityMonitoring() {
    if (this.securityConfig.enableIntegrityChecks) {
      setInterval(() => {
        this.performIntegrityCheck();
      }, this.securityConfig.integrityCheckInterval);
    }
    
    this.log('[SECURITY] Security monitoring started');
  },
  
  /**
   * Apply security mitigations
   */
  async applySecurityMitigations(violations) {
    for (const violation of violations) {
      switch (violation.type) {
        case 'debug_mode':
          // Disable debug features
          if (window.UI) {
            window.UI.state.labMode = false;
          }
          break;
          
        case 'dev_tools':
          // Attempt to close dev tools
          this.closeDevTools();
          break;
          
        case 'console_access':
          // Further restrict console
          this.restrictConsole();
          break;
          
        case 'external_scripts':
          // Remove external scripts
          this.removeExternalScripts();
          break;
      }
    }
  },
  
  /**
   * Disable all functionality
   */
  disableAllFunctionality() {
    // Disable all buttons and inputs
    const elements = document.querySelectorAll('button, input, select, textarea');
    elements.forEach(element => {
      element.disabled = true;
    });
    
    // Clear sensitive data
    if (window.UI) {
      window.UI.clearState();
    }
    
    // Disable module functionality
    if (window.ResurrectionEngine) {
      window.ResurrectionEngine.enabled = false;
    }
    
    if (window.PolicyGuard) {
      window.PolicyGuard.enabled = false;
    }
  },
  
  /**
   * Show lockdown message
   */
  showLockdownMessage(reason) {
    const lockdownDiv = document.createElement('div');
    lockdownDiv.id = 'security-lockdown';
    lockdownDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #1a0000;
      color: #ff6b6b;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      font-size: 16px;
      text-align: center;
    `;
    
    lockdownDiv.innerHTML = `
      <div style="max-width: 600px; padding: 20px;">
        <h1 style="color: #ff3333; margin-bottom: 20px;">SECURITY LOCKDOWN</h1>
        <p style="margin-bottom: 10px;">[SECURITY] Runtime integrity compromised.</p>
        <p style="margin-bottom: 10px;">[LOCKDOWN] Execution halted.</p>
        <p style="margin-bottom: 20px;">Reason: ${reason}</p>
        <p style="font-size: 12px; color: #999;">Please restart the application.</p>
      </div>
    `;
    
    document.body.appendChild(lockdownDiv);
  },
  
  // Helper methods
  calculateModuleHash(module) {
    // Simple hash calculation for demonstration
    const moduleString = JSON.stringify(module);
    let hash = 0;
    for (let i = 0; i < moduleString.length; i++) {
      const char = moduleString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  },
  
  checkModuleStructure(module, moduleName) {
    // Define expected structure for critical modules
    const expectedStructures = {
      resurrection_core: ['run', 'initialize'],
      policy_guard: ['validate', 'setPolicy'],
      evidence_logger: ['log', 'getEntries'],
      role_manager: ['hasPermission', 'getCurrentRole'],
      enterprise_manager: ['isEnterpriseMode', 'enableEnterpriseMode']
    };
    
    const expectedMethods = expectedStructures[moduleName];
    if (!expectedMethods) {
      return null;
    }
    
    for (const method of expectedMethods) {
      if (typeof module[method] !== 'function') {
        return {
          type: 'structure_violation',
          module: moduleName,
          severity: 'high',
          message: `Missing required method: ${method}`
        };
      }
    }
    
    return null;
  },
  
  isDebugMode() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  },
  
  isDevToolsOpen() {
    const threshold = 160;
    return window.outerHeight - window.innerHeight > threshold || 
           window.outerWidth - window.innerWidth > threshold;
  },
  
  hasConsoleAccess() {
    try {
      console.log();
      return true;
    } catch {
      return false;
    }
  },
  
  hasExternalScripts() {
    const scripts = document.querySelectorAll('script[src]');
    return Array.from(scripts).some(script => !script.src.startsWith('file://'));
  },
  
  closeDevTools() {
    // Attempt to close dev tools (limited effectiveness)
    window.close();
  },
  
  restrictConsole() {
    // Further restrict console access
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.debug = () => {};
  },
  
  removeExternalScripts() {
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      if (!script.src.startsWith('file://')) {
        script.remove();
      }
    });
  },
  
  async loadKnownHashes() {
    // In a real implementation, this would load from secure storage
    // For now, we'll use placeholder hashes
    this.knownHashes.set('resurrection_core', 'abc123');
    this.knownHashes.set('policy_guard', 'def456');
    this.knownHashes.set('evidence_logger', 'ghi789');
  },
  
  async logSecurityEvent(eventType, data) {
    try {
      const event = {
        type: 'security',
        eventType,
        timestamp: new Date().toISOString(),
        data,
        integrityChecks: this.securityMetrics.integrityChecks,
        tamperAttempts: this.securityMetrics.tamperAttempts
      };
      
      if (window.EvidenceLogger) {
        await window.EvidenceLogger.addEvidenceLog(event);
      }
      
      if (this.securityConfig.logAllSecurityEvents) {
        console.log(`[SECURITY_EVENT] ${eventType}:`, data);
      }
      
    } catch (error) {
      console.error('[SECURITY] Failed to log security event:', error);
    }
  },
  
  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      initialized: this.initialized,
      integrityChecked: this.integrityChecked,
      tamperDetected: this.tamperDetected,
      lockdownMode: this.lockdownMode,
      metrics: { ...this.securityMetrics },
      config: { ...this.securityConfig }
    };
  },
  
  /**
   * Log security hardening events
   */
  log(message) {
    console.log(`[SECURITY_HARDENING] ${message}`);
    if (window.EvidenceLogger) {
      window.EvidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityHardening;
} else {
  window.SecurityHardening = SecurityHardening;
}
