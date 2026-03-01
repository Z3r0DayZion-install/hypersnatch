/**
 * Engine Core Module
 * Central orchestration for the HyperSnatch resurrection engine
 */

const EngineCore = {
  // Module metadata
  name: 'engine_core',
  version: '1.0.0',
  description: 'Central orchestration engine for HyperSnatch',
  
  // Core state
  initialized: false,
  modules: new Map(),
  telemetry: {
    totalInputsProcessed: 0,
    avgConfidence: 0,
    refusalRate: 0,
    strategyPackUsage: 0,
    policyViolations: 0,
    sessionStart: null,
    lastActivity: null
  },
  
  /**
   * Initialize engine core
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      this.telemetry.sessionStart = new Date().toISOString();
      this.telemetry.lastActivity = new Date().toISOString();
      
      // Initialize core modules
      await this.initializeModules();
      
      this.initialized = true;
      this.log('[ENGINE] Engine core initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Engine core initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Initialize core modules
   */
  async initializeModules() {
    const coreModules = [
      { name: 'resurrection_core', path: '../modules/resurrection_core.js' },
      { name: 'policy_guard', path: '../modules/policy_guard.js' },
      { name: 'evidence_logger', path: '../core/evidence_logger.js' }
    ];
    
    for (const moduleInfo of coreModules) {
      try {
        await this.loadModule(moduleInfo.name, moduleInfo.path);
        this.log(`[ENGINE] Module loaded: ${moduleInfo.name}`);
      } catch (error) {
        this.log(`[ERROR] Failed to load module ${moduleInfo.name}: ${error.message}`);
        throw error;
      }
    }
  },
  
  /**
   * Load module
   */
  async loadModule(name, path) {
    if (this.modules.has(name)) {
      return this.modules.get(name);
    }
    
    try {
      // In Electron environment, modules would be loaded via secure bridge
      // For now, we'll simulate module loading
      let module;
      
      switch (name) {
        case 'resurrection_core':
          module = typeof window !== 'undefined' ? window.ResurrectionCore : require('../modules/resurrection_core.js');
          break;
        case 'policy_guard':
          module = typeof window !== 'undefined' ? window.PolicyGuard : require('../modules/policy_guard.js');
          break;
        case 'evidence_logger':
          module = typeof window !== 'undefined' ? window.EvidenceLogger : require('./evidence_logger.js');
          break;
        default:
          throw new Error(`Unknown module: ${name}`);
      }
      
      if (!module) {
        throw new Error(`Module not found: ${name}`);
      }
      
      // Initialize module if it has initialize method
      if (typeof module.initialize === 'function') {
        await module.initialize();
      }
      
      this.modules.set(name, module);
      return module;
    } catch (error) {
      throw new Error(`Failed to load module ${name}: ${error.message}`);
    }
  },
  
  /**
   * Get module
   */
  getModule(name) {
    return this.modules.get(name);
  },
  
  /**
   * Main engine processing pipeline
   */
  async process(input, options = {}) {
    try {
      this.telemetry.lastActivity = new Date().toISOString();
      this.telemetry.totalInputsProcessed++;
      
      this.log('[ENGINE] Starting processing pipeline');
      
      // Validate input
      if (!this.validateInput(input)) {
        throw new Error('Invalid input');
      }
      
      // Get core modules
      const resurrectionCore = this.getModule('resurrection_core');
      const policyGuard = this.getModule('policy_guard');
      const evidenceLogger = this.getModule('evidence_logger');
      
      if (!resurrectionCore || !policyGuard || !evidenceLogger) {
        throw new Error('Core modules not available');
      }
      
      // Log processing start
      evidenceLogger.logModuleOperation('engine_core', 'process_start', 'success', {
        inputType: input.sourceType,
        inputSize: input.rawInput?.length || 0
      });
      
      // Step 1: Resurrection processing
      const resurrectionResult = await resurrectionCore.run({
        sourceType: input.sourceType,
        rawInput: input.rawInput,
        policyState: options.policyState || 'strict'
      });
      
      // Step 2: Policy validation
      const policyValidation = policyGuard.validate(input.rawInput, {
        sourceType: input.sourceType
      });
      
      // Step 3: Apply strategy packs (Disabled in Survival Mode)
      const strategyResults = [];
      
      // Step 4: Final result assembly
      const finalResult = this.assembleResult({
        resurrection: resurrectionResult,
        policy: policyValidation,
        strategies: strategyResults,
        metadata: {
          processedAt: new Date().toISOString(),
          engineVersion: 'RES-CORE-01',
          sessionId: evidenceLogger.sessionId,
          processingTime: Date.now() - new Date(this.telemetry.lastActivity).getTime()
        }
      });
      
      // Update telemetry
      this.updateTelemetry(finalResult);
      
      // Log processing completion
      evidenceLogger.logModuleOperation('engine_core', 'process_complete', 'success', {
        candidatesFound: finalResult.candidates.length,
        policyViolation: finalResult.policy.violations.length > 0,
        processingTime: finalResult.metadata.processingTime
      });
      
      this.log(`[ENGINE] Processing complete. ${finalResult.candidates.length} candidates found`);
      return finalResult;
      
    } catch (error) {
      this.log(`[ERROR] Processing failed: ${error.message}`);
      
      const evidenceLogger = this.getModule('evidence_logger');
      if (evidenceLogger) {
        evidenceLogger.logModuleOperation('engine_core', 'process_error', 'error', {
          error: error.message
        });
      }
      
      throw error;
    }
  },
  
  /**
   * Apply strategy packs (Disabled)
   */
  async applyStrategyPacks(input, strategyPacks) {
    return [];
  },
  
  /**
   * Assemble final result
   */
  assembleResult(components) {
    const { resurrection, policy, strategies, metadata } = components;
    
    return {
      // Core resurrection results
      candidates: resurrection.candidates,
      confidenceScores: resurrection.confidenceScores,
      detectedMarkers: resurrection.detectedMarkers,
      
      // Policy results
      policy: {
        valid: policy.valid,
        violations: policy.violations,
        confidence: policy.confidence,
        canProceed: policy.canProceed
      },
      
      // Strategy results
      strategies: strategies.map(s => ({
        packName: s.packName,
        links: s.result.links || [],
        statistics: s.result.statistics || {}
      })),
      
      // Processing metadata
      metadata,
      
      // Engine state
      engine: {
        version: 'RES-CORE-01',
        telemetry: this.getTelemetrySnapshot()
      },
      
      // Export control
      exportControl: {
        canExport: policy.valid && resurrection.refusal !== true,
        refusalReason: resurrection.refusalReason || 
          (policy.valid ? null : 'Policy violation detected')
      }
    };
  },
  
  /**
   * Validate input
   */
  validateInput(input) {
    if (!input || typeof input !== 'object') {
      return false;
    }
    
    if (!input.sourceType || !['HTML', 'HAR', 'URL'].includes(input.sourceType)) {
      return false;
    }
    
    if (!input.rawInput || typeof input.rawInput !== 'string') {
      return false;
    }
    
    return true;
  },
  
  /**
   * Update telemetry
   */
  updateTelemetry(result) {
    // Update average confidence
    if (result.confidenceScores.length > 0) {
      const avgConfidence = result.confidenceScores.reduce((a, b) => a + b, 0) / result.confidenceScores.length;
      this.telemetry.avgConfidence = (this.telemetry.avgConfidence + avgConfidence) / 2;
    }
    
    // Update refusal rate
    if (result.exportControl.refusalReason) {
      this.telemetry.refusalRate = (this.telemetry.refusalRate + 1) / this.telemetry.totalInputsProcessed;
    }
    
    // Update policy violations
    if (result.policy.violations.length > 0) {
      this.telemetry.policyViolations++;
    }
  },
  
  /**
   * Get telemetry snapshot
   */
  getTelemetrySnapshot() {
    return {
      ...this.telemetry,
      sessionDuration: this.telemetry.sessionStart ? 
        Date.now() - new Date(this.telemetry.sessionStart).getTime() : 0
    };
  },
  
  /**
   * Get engine status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      modulesLoaded: Array.from(this.modules.keys()),
      telemetry: this.getTelemetrySnapshot(),
      version: '1.0.0',
      uptime: this.telemetry.sessionStart ? 
        Date.now() - new Date(this.telemetry.sessionStart).getTime() : 0
    };
  },
  
  /**
   * Reset telemetry
   */
  resetTelemetry() {
    this.telemetry = {
      totalInputsProcessed: 0,
      avgConfidence: 0,
      refusalRate: 0,
      strategyPackUsage: 0,
      policyViolations: 0,
      sessionStart: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    this.log('[ENGINE] Telemetry reset');
  },
  
  /**
   * Shutdown engine
   */
  async shutdown() {
    try {
      // Shutdown all modules
      for (const [name, module] of this.modules) {
        if (typeof module.shutdown === 'function') {
          await module.shutdown();
        }
      }
      
      this.modules.clear();
      this.initialized = false;
      
      this.log('[ENGINE] Engine core shutdown');
      return true;
    } catch (error) {
      this.log(`[ERROR] Engine shutdown failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Log message
   */
  log(message) {
    console.log(`[ENGINE_CORE] ${message}`);
    
    const evidenceLogger = this.getModule('evidence_logger');
    if (evidenceLogger) {
      evidenceLogger.info(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EngineCore;
} else {
  window.EngineCore = EngineCore;
}
