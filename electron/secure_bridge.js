/**
 * Secure Bridge Module
 * Provides additional security layer between preload and main process
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecureBridge {
  constructor() {
    this.moduleCache = new Map();
    this.signatureCache = new Map();
    this.requireSignedImport = true;
    this.trustedKeys = new Set();
    this.loadTrustedKeys();
  }

  loadTrustedKeys() {
    // Load trusted public keys for signature verification
    try {
      const keysPath = path.join(__dirname, '..', 'security', 'trusted_keys.json');
      if (fs.existsSync(keysPath)) {
        const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
        keys.forEach(key => this.trustedKeys.add(key));
      }
    } catch (error) {
      console.error('[SECURITY] Failed to load trusted keys:', error);
    }
  }

  /**
   * Verify module hash
   */
  verifyHash(filePath, expectedHash) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Module not found: ${filePath}`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      if (actualHash !== expectedHash) {
        throw new Error(`Hash verification failed for ${filePath}`);
      }

      return true;
    } catch (error) {
      console.error('[SECURITY] Hash verification error:', error);
      return false;
    }
  }

  /**
   * Verify digital signature
   */
  verifySignature(filePath, signature) {
    try {
      if (!signature) {
        if (this.requireSignedImport) {
          throw new Error('Signature required but not provided');
        }
        return true; // Unsigned allowed if not required
      }

      const fileBuffer = fs.readFileSync(filePath);
      
      // Try each trusted key
      for (const publicKey of this.trustedKeys) {
        try {
          const verify = crypto.createVerify('SHA256');
          verify.update(fileBuffer);
          
          if (verify.verify(publicKey, signature, 'base64')) {
            return true;
          }
        } catch (keyError) {
          // Try next key
          continue;
        }
      }

      throw new Error('No valid signature found');
    } catch (error) {
      console.error('[SECURITY] Signature verification error:', error);
      return false;
    }
  }

  /**
   * Load and validate module
   */
  async loadModule(moduleName, modulePath, expectedHash, signature = null) {
    try {
      // Check cache first
      if (this.moduleCache.has(moduleName)) {
        return this.moduleCache.get(moduleName);
      }

      const fullPath = path.resolve(modulePath);
      
      // Verify hash
      if (!this.verifyHash(fullPath, expectedHash)) {
        throw new Error(`Module hash verification failed: ${moduleName}`);
      }

      // Verify signature
      if (!this.verifySignature(fullPath, signature)) {
        throw new Error(`Module signature verification failed: ${moduleName}`);
      }

      // Load module
      const moduleCode = fs.readFileSync(fullPath, 'utf8');
      
      // Create secure module context
      const moduleExports = {};
      const module = {
        exports: moduleExports
      };

      // Execute module in controlled context
      const secureWrapper = `
        (function(module, exports, require, __filename, __dirname) {
          ${moduleCode}
        })
      `;
      
      const secureModule = eval(secureWrapper);
      secureModule(module, moduleExports, this.createSecureRequire(), fullPath, path.dirname(fullPath));

      // Cache validated module
      this.moduleCache.set(moduleName, moduleExports);
      
      console.log(`[SECURITY] Module loaded successfully: ${moduleName}`);
      return moduleExports;
      
    } catch (error) {
      console.error(`[SECURITY] Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Create secure require function
   */
  createSecureRequire() {
    const allowedModules = new Set(['crypto', 'path', 'fs']);
    
    return (moduleName) => {
      if (!allowedModules.has(moduleName)) {
        throw new Error(`Module not allowed: ${moduleName}`);
      }
      return require(moduleName);
    };
  }

  /**
   * Validate strategy pack
   */
  async validateStrategyPack(packPath) {
    try {
      const packManifestPath = path.join(packPath, 'pack.json');
      
      if (!fs.existsSync(packManifestPath)) {
        throw new Error('Strategy pack manifest not found');
      }

      const manifest = JSON.parse(fs.readFileSync(packManifestPath, 'utf8'));
      
      // Validate required fields
      const requiredFields = ['name', 'version', 'description', 'rules', 'hash', 'signature'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Verify main pack file
      const mainPackPath = path.join(packPath, manifest.main || 'pack.js');
      if (!this.verifyHash(mainPackPath, manifest.hash)) {
        throw new Error('Strategy pack hash verification failed');
      }

      if (!this.verifySignature(mainPackPath, manifest.signature)) {
        throw new Error('Strategy pack signature verification failed');
      }

      // Load and validate rules
      const packCode = fs.readFileSync(mainPackPath, 'utf8');
      
      // Basic security scan
      const dangerousPatterns = [
        /fetch\s*\(/,
        /XMLHttpRequest/,
        /WebSocket/,
        /eval\s*\(/,
        /Function\s*\(/,
        /require\s*\(\s*['"]\.\./,
        /process\./,
        /global\./,
        /window\./,
        /document\./
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(packCode)) {
          throw new Error(`Dangerous pattern detected in strategy pack: ${pattern}`);
        }
      }

      return {
        valid: true,
        manifest,
        packPath
      };
      
    } catch (error) {
      console.error('[SECURITY] Strategy pack validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Clear module cache
   */
  clearCache() {
    this.moduleCache.clear();
    this.signatureCache.clear();
    console.log('[SECURITY] Module cache cleared');
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      modulesLoaded: this.moduleCache.size,
      trustedKeys: this.trustedKeys.size,
      requireSignedImport: this.requireSignedImport,
      cacheSize: this.moduleCache.size
    };
  }
}

module.exports = SecureBridge;
