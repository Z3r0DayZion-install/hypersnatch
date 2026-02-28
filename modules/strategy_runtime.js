/**
 * Strategy Runtime Module
 * Manages loading and execution of signed strategy packs
 */

const StrategyRuntime = {
  // Module metadata
  name: 'strategy_runtime',
  version: '1.0.0',
  description: 'Strategy pack loading and execution runtime',
  
  // Runtime state
  initialized: false,
  loadedPacks: new Map(),
  activeStrategies: new Map(),
  requireSignature: true,
  enabled: false,
  trustedPackHashes: [],
  
  // Strategy pack interface
  strategyInterface: {
    // Required methods
    process: function(input, context) { throw new Error('Not implemented'); },
    validate: function(input) { return true; },
    getMetadata: function() { return {}; }
  },
  
  /**
   * Initialize strategy runtime
   */
  initialize() {
    if (this.initialized) return true;
    
    try {
      this.loadedPacks.clear();
      this.activeStrategies.clear();
      this.refreshPolicy();
      this.initialized = true;
      
      this.log('[RUNTIME] Strategy runtime initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to initialize strategy runtime: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Load strategy pack
   */
  async loadStrategyPack(packPath, signature = null) {
    try {
      this.log(`[RUNTIME] Loading strategy pack: ${packPath}`);
      
      // Validate pack structure
      const validation = await this.validateStrategyPack(packPath, signature);
      if (!validation.valid) {
        throw new Error(`Strategy pack validation failed: ${validation.error}`);
      }
      
      // Load pack manifest
      const manifest = validation.manifest;
      
      // Check if pack already loaded
      if (this.loadedPacks.has(manifest.name)) {
        this.log(`[RUNTIME] Strategy pack already loaded: ${manifest.name}`);
        return this.loadedPacks.get(manifest.name);
      }
      
      // Load strategy code
      const strategyCode = await this.loadStrategyCode(packPath, manifest);
      
      // Create strategy instance
      const strategy = this.createStrategyInstance(manifest, strategyCode);
      
      // Register strategy
      this.loadedPacks.set(manifest.name, {
        manifest,
        strategy,
        loadedAt: new Date().toISOString(),
        signature
      });
      
      this.log(`[RUNTIME] Strategy pack loaded successfully: ${manifest.name} v${manifest.version}`);
      return strategy;
      
    } catch (error) {
      this.log(`[ERROR] Failed to load strategy pack: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Validate strategy pack
   */
  async validateStrategyPack(packPath, signature) {
    try {
      const manifestPath = `${packPath}/pack.json`;
      
      // Check manifest exists
      const manifestExists = await this.fileExists(manifestPath);
      if (!manifestExists) {
        return { valid: false, error: 'pack.json not found' };
      }
      
      // Load manifest
      const manifestContent = await this.readFile(manifestPath);
      const manifest = JSON.parse(manifestContent);
      
      // Validate required fields
      const requiredFields = ['name', 'version', 'description', 'main', 'rules'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          return { valid: false, error: `Missing required field: ${field}` };
        }
      }
      
      // Validate strategy file exists
      // Validate strategy entrypoint (path traversal defense)
      if (typeof manifest.main !== "string" || manifest.main.includes("..") || /[\\\\:]/.test(manifest.main)) {
        return { valid: false, error: "Invalid strategy entrypoint" };
      }

      const strategyPath = `${packPath}/${manifest.main}`;
      const strategyExists = await this.fileExists(strategyPath);
      if (!strategyExists) {
        return { valid: false, error: `Strategy file not found: ${manifest.main}` };
      }
      
      // Verify signature if required
      if (this.requireSignature && !signature) {
        return { valid: false, error: 'Signature required but not provided' };
      }
      
      if (signature) {
        const signatureValid = await this.verifySignature(strategyPath, signature);
        if (!signatureValid) {
          return { valid: false, error: 'Invalid signature' };
        }
      }
      
      // Security scan strategy code
      const strategyCode = await this.readFile(strategyPath);
      const securityCheck = this.performSecurityScan(strategyCode);
      if (!securityCheck.safe) {
        return { valid: false, error: `Security violation: ${securityCheck.violations.join(', ')}` };
      }
      
      // Pack integrity allowlist (policy-controlled)
      this.refreshPolicy();
      const packHash = await this.computePackHash(manifestContent, strategyCode);
      if (!Array.isArray(this.trustedPackHashes) || this.trustedPackHashes.length === 0) {
        return { valid: false, error: "No trusted strategy pack hashes configured" };
      }
      if (!this.trustedPackHashes.includes(packHash)) {
        return { valid: false, error: `Untrusted strategy pack (sha256:${packHash.slice(0, 12)}…)` };
      }

      return { valid: true, manifest, packHash };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },
  
  /**
   * Load strategy code
   */
  async loadStrategyCode(packPath, manifest) {
    const strategyPath = `${packPath}/${manifest.main}`;
    return await this.readFile(strategyPath);
  },
  
  /**
   * Create strategy instance
   */
  createStrategyInstance(manifest, strategyCode) {
    try {
      // Create secure execution context
      const secureContext = this.createSecureContext();
      
      // Execute strategy code
      const strategyFactory = new Function('context', 'exports', `
        "use strict";
        const window = undefined;
        const document = undefined;
        const globalThis = undefined;
        const global = undefined;
        const process = undefined;
        const require = undefined;
        const Function = undefined;
        const eval = undefined;
        const fetch = undefined;
        const XMLHttpRequest = undefined;
        const WebSocket = undefined;

        ${strategyCode}
        return exports.default || exports;
      `);
      
      const exports = {};
      const strategy = strategyFactory(secureContext, exports);
      
      // Validate strategy interface
      this.validateStrategyInterface(strategy);
      
      // Wrap strategy with security
      return this.wrapStrategy(strategy, manifest);
      
    } catch (error) {
      throw new Error(`Failed to create strategy instance: ${error.message}`);
    }
  },
  
  /**
   * Create secure execution context
   */
  createSecureContext() {
    return {
      console: {
        log: (msg) => this.log(`[STRATEGY] ${msg}`),
        error: (msg) => this.log(`[STRATEGY_ERROR] ${msg}`),
        warn: (msg) => this.log(`[STRATEGY_WARN] ${msg}`)
      },
      setTimeout: (fn, delay) => setTimeout(fn, Math.min(delay, 5000)), // Cap timeouts
      clearTimeout: clearTimeout,
      
      // Safe utilities
      utils: {
        regex: {
          test: (pattern, text) => new RegExp(pattern).test(text),
          match: (pattern, text) => text.match(new RegExp(pattern)),
          escape: (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        },
        string: {
          contains: (haystack, needle) => haystack.includes(needle),
          startsWith: (str, prefix) => str.startsWith(prefix),
          endsWith: (str, suffix) => str.endsWith(suffix),
          trim: (str) => str.trim()
        },
        array: {
          unique: (arr) => [...new Set(arr)],
          filter: (arr, predicate) => arr.filter(predicate),
          map: (arr, mapper) => arr.map(mapper)
        }
      }
    };
  },
  
  /**
   * Validate strategy interface
   */
  validateStrategyInterface(strategy) {
    const requiredMethods = ['process', 'validate', 'getMetadata'];
    
    for (const method of requiredMethods) {
      if (typeof strategy[method] !== 'function') {
        throw new Error(`Strategy missing required method: ${method}`);
      }
    }
  },
  
  /**
   * Wrap strategy with security
   */
  wrapStrategy(strategy, manifest) {
    return {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      
      async process(input, context = {}) {
        try {
          // Validate input
          if (!strategy.validate(input)) {
            throw new Error('Input validation failed');
          }
          
          // Add security context
          const secureContext = {
            ...context,
            strategyName: manifest.name,
            timestamp: new Date().toISOString(),
            maxExecutionTime: 10000 // 10 second limit
          };
          
          // Execute with timeout
          const result = await this.executeWithTimeout(
            () => strategy.process(input, secureContext),
            secureContext.maxExecutionTime
          );
          
          this.log(`[STRATEGY] ${manifest.name} processed successfully`);
          return result;
          
        } catch (error) {
          this.log(`[STRATEGY] ${manifest.name} processing failed: ${error.message}`);
          throw error;
        }
      },
      
      validate(input) {
        return strategy.validate(input);
      },
      
      getMetadata() {
        return {
          ...strategy.getMetadata(),
          packName: manifest.name,
          packVersion: manifest.version,
          loadedAt: new Date().toISOString()
        };
      }
    };
  },
  
  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Strategy execution timeout'));
      }, timeout);
      
      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  },
  
  /**
   * Unload strategy pack
   */
  unloadStrategyPack(packName) {
    if (this.loadedPacks.has(packName)) {
      this.loadedPacks.delete(packName);
      this.activeStrategies.delete(packName);
      this.log(`[RUNTIME] Strategy pack unloaded: ${packName}`);
      return true;
    }
    return false;
  },
  
  /**
   * Get loaded strategy packs
   */
  getLoadedPacks() {
    return Array.from(this.loadedPacks.keys());
  },
  
  /**
   * Get strategy pack info
   */
  getStrategyPackInfo(packName) {
    const pack = this.loadedPacks.get(packName);
    if (!pack) return null;
    
    return {
      name: pack.manifest.name,
      version: pack.manifest.version,
      description: pack.manifest.description,
      loadedAt: pack.loadedAt,
      hasSignature: !!pack.signature
    };
  },
  
  /**
   * Perform security scan
   */
  performSecurityScan(code) {
    const violations = [];
    
    // Dangerous patterns
    const dangerousPatterns = [
      { pattern: /fetch\s*\(/, desc: 'Network access (fetch)' },
      { pattern: /XMLHttpRequest/, desc: 'Network access (XHR)' },
      { pattern: /WebSocket/, desc: 'Network access (WebSocket)' },
      { pattern: /eval\s*\(/, desc: 'Dynamic code execution (eval)' },
      { pattern: /Function\s*\(/, desc: 'Dynamic code execution (Function)' },
      { pattern: /require\s*\(\s*['"]\.\./, desc: 'File system access' },
      { pattern: /process\./, desc: 'System access' },
      { pattern: /global\./, desc: 'Global access' },
      { pattern: /window\./, desc: 'Window access' },
      { pattern: /document\./, desc: 'DOM access' }
    ];
    
    dangerousPatterns.forEach(({ pattern, desc }) => {
      if (pattern.test(code)) {
        violations.push(desc);
      }
    });
    
    return {
      safe: violations.length === 0,
      violations
    };
  },
  
  /**
   * Verify signature
   */
  async verifySignature(filePath, signature) {
    try {
      const sig = String(signature || "").trim();
      if (!sig) return false;

      const code = await this.readFile(filePath);
      const actual = await this.sha256Hex(code);

      let expected = sig.toLowerCase();
      if (expected.startsWith("sha256:")) expected = expected.slice("sha256:".length);
      if (expected.startsWith("sha256=")) expected = expected.slice("sha256=".length);
      expected = expected.trim();

      if (!/^[a-f0-9]{64}$/.test(expected)) return false;
      return expected === actual;
    } catch (e) {
      this.log(`[RUNTIME] Signature verification error: ${e.message}`);
      return false;
    }
  },
  
  /**
   * File system helpers
   */
  async fileExists(path) {
    try {
      if (window.hyper && window.hyper.readFile) {
        await window.hyper.readFile(path);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  
  async readFile(path) {
    if (window.hyper && window.hyper.readFile) {
      return await window.hyper.readFile(path);
    }
    throw new Error('File reading not available');
  },
  
  /**
   * Log runtime events
   */
  log(message) {
    console.log(`[STRATEGY_RUNTIME] ${message}`);
    if (window.hyper && window.hyper.logEvidence) {
      window.hyper.logEvidence(message);
    }
  },
  
  /**
   * Generate runtime report
   */
  generateReport() {
    const packs = Array.from(this.loadedPacks.entries()).map(([name, pack]) => ({
      name,
      version: pack.manifest.version,
      loadedAt: pack.loadedAt,
      hasSignature: !!pack.signature
    }));
    
    return {
      timestamp: new Date().toISOString(),
      loadedPacks: packs.length,
      requireSignature: this.requireSignature,
      packs
    };
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StrategyRuntime;
} else {
  window.StrategyRuntime = StrategyRuntime;
}
