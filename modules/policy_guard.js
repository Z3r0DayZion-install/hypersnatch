/**
 * Policy Guard Module
 * Enforces Cash Policy Shield and content restrictions
 */

const PolicyGuard = {
  // Module metadata
  name: 'policy_guard',
  version: '1.0.0',
  description: 'Policy enforcement and content filtering for Cash Policy Shield compliance',

  // Policy state
  initialized: false,
  currentPolicy: 'strict',
  policyVersion: 'CASH-SHIELD-01',

  // Policy rules
  rules: {
    strict: {
      allowPremiumContent: false,
      allowLoginRequired: false,
      allowDRMProtected: false,
      allowSubscriptionOnly: false,
      minConfidenceThreshold: 0.6,
      allowUnsignedImports: false,
      enableAirgapEnforcement: true
    },
    standard: {
      allowPremiumContent: false,
      allowLoginRequired: true,
      allowDRMProtected: false,
      allowSubscriptionOnly: false,
      minConfidenceThreshold: 0.4,
      allowUnsignedImports: false,
      enableAirgapEnforcement: true
    },
    permissive: {
      allowPremiumContent: true,
      allowLoginRequired: true,
      allowDRMProtected: false,
      allowSubscriptionOnly: true,
      minConfidenceThreshold: 0.3,
      allowUnsignedImports: true,
      enableAirgapEnforcement: false
    }
  },

  // Detection patterns
  patterns: {
    premium: [
      /premium\s+content/i,
      /premium\s+article/i,
      /premium\s+access/i,
      /subscribe\s+to\s+read/i,
      /subscription\s+required/i,
      /paywall/i,
      /paid\s+content/i,
      /member\s+exclusive/i,
      /upgrade\s+to\s+access/i
    ],
    login: [
      /sign\s+in\s+to\s+continue/i,
      /log\s+in\s+required/i,
      /login\s+to\s+access/i,
      /authentication\s+required/i,
      /credentials\s+required/i,
      /please\s+log\s+in/i,
      /sign\s+up\s+to\s+continue/i
    ],
    drm: [
      /drm\s+protected/i,
      /digital\s+rights\s+management/i,
      /copy\s+protected/i,
      /access\s+control/i,
      /license\s+required/i,
      /authorization\s+required/i
    ],
    subscription: [
      /subscription\s+only/i,
      /members\s+only/i,
      /paid\s+subscription/i,
      /premium\s+subscription/i,
      /subscriber\s+access/i
    ]
  },

  /**
   * Initialize policy guard
   */
  initialize(policy = 'strict') {
    if (this.initialized) return true;

    try {
      this.currentPolicy = policy;
      this.initialized = true;

      this.log(`[POLICY] Policy guard initialized with ${policy} policy`);
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to initialize policy guard: ${error.message}`);
      return false;
    }
  },

  /**
   * Set current policy
   */
  setPolicy(policy) {
    if (!this.rules[policy]) {
      throw new Error(`Unknown policy: ${policy}`);
    }

    this.currentPolicy = policy;
    this.log(`[POLICY] Policy changed to: ${policy}`);
  },

  /**
   * Validate content against current policy
   */
  validate(content, metadata = {}) {
    const policy = this.rules[this.currentPolicy];
    const violations = [];

    // Check for premium content
    if (!policy.allowPremiumContent) {
      const premiumMatches = this.detectPatterns(content, this.patterns.premium);
      if (premiumMatches.length > 0) {
        violations.push({
          type: 'premium_content',
          severity: 'high',
          matches: premiumMatches,
          rule: 'allowPremiumContent'
        });
      }
    }

    // Check for login requirements
    if (!policy.allowLoginRequired) {
      const loginMatches = this.detectPatterns(content, this.patterns.login);
      if (loginMatches.length > 0) {
        violations.push({
          type: 'login_required',
          severity: 'medium',
          matches: loginMatches,
          rule: 'allowLoginRequired'
        });
      }
    }

    // Check for DRM protection
    if (!policy.allowDRMProtected) {
      const drmMatches = this.detectPatterns(content, this.patterns.drm);
      if (drmMatches.length > 0) {
        violations.push({
          type: 'drm_protected',
          severity: 'high',
          matches: drmMatches,
          rule: 'allowDRMProtected'
        });
      }
    }

    // Check for subscription requirements
    if (!policy.allowSubscriptionOnly) {
      const subMatches = this.detectPatterns(content, this.patterns.subscription);
      if (subMatches.length > 0) {
        violations.push({
          type: 'subscription_required',
          severity: 'medium',
          matches: subMatches,
          rule: 'allowSubscriptionOnly'
        });
      }
    }

    const result = {
      valid: violations.length === 0,
      policy: this.currentPolicy,
      violations,
      confidence: this.calculateConfidence(violations),
      canProceed: violations.length === 0 || this.hasLowSeverityViolations(violations)
    };

    this.log(`[POLICY] Validation result: ${result.valid ? 'PASS' : 'FAIL'} (${violations.length} violations)`);
    return result;
  },

  /**
   * Check if export is allowed for candidate
   */
  canExport(candidate, confidence = 0) {
    const policy = this.rules[this.currentPolicy];

    // Check confidence threshold
    if (confidence < policy.minConfidenceThreshold) {
      return {
        allowed: false,
        reason: `Confidence ${confidence} below threshold ${policy.minConfidenceThreshold}`
      };
    }

    // Validate candidate content
    const content = this.extractContentFromCandidate(candidate);
    const validation = this.validate(content);

    if (!validation.valid) {
      const highSeverityViolations = validation.violations.filter(v => v.severity === 'high');
      if (highSeverityViolations.length > 0) {
        return {
          allowed: false,
          reason: `Policy violation: ${highSeverityViolations.map(v => v.type).join(', ')}`
        };
      }
    }

    return {
      allowed: true,
      reason: 'Export approved'
    };
  },

  /**
   * Filter candidates based on policy
   */
  filterCandidates(candidates, confidenceScores) {
    const policy = this.rules[this.currentPolicy];
    const filtered = [];
    const blocked = [];

    candidates.forEach((candidate, index) => {
      const confidence = confidenceScores[index] || 0;
      const exportCheck = this.canExport(candidate, confidence);

      if (exportCheck.allowed) {
        filtered.push({
          candidate,
          confidence,
          reason: exportCheck.reason
        });
      } else {
        blocked.push({
          candidate,
          confidence,
          reason: exportCheck.reason
        });
      }
    });

    this.log(`[POLICY] Filtered ${filtered.length} approved, ${blocked.length} blocked candidates`);

    return {
      approved: filtered,
      blocked,
      totalProcessed: candidates.length
    };
  },

  /**
   * Detect patterns in content
   */
  detectPatterns(content, patterns) {
    const matches = [];

    patterns.forEach(pattern => {
      const found = content.match(pattern);
      if (found) {
        matches.push({
          pattern: pattern.source,
          matches: found,
          count: found.length
        });
      }
    });

    return matches;
  },

  /**
   * Calculate confidence based on violations
   */
  calculateConfidence(violations) {
    if (violations.length === 0) return 1.0;

    let confidence = 1.0;
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'high':
          confidence -= 0.4;
          break;
        case 'medium':
          confidence -= 0.2;
          break;
        case 'low':
          confidence -= 0.1;
          break;
      }
    });

    return Math.max(0, confidence);
  },

  /**
   * Check if violations are low severity only
   */
  hasLowSeverityViolations(violations) {
    return violations.every(v => v.severity === 'low');
  },

  /**
   * Extract content from candidate
   */
  extractContentFromCandidate(candidate) {
    const parts = [
      candidate.url || '',
      candidate.text || '',
      candidate.title || '',
      candidate.content || ''
    ];

    return parts.join(' ').toLowerCase();
  },

  /**
   * Get current policy settings
   */
  getCurrentPolicy() {
    return {
      name: this.currentPolicy,
      settings: this.rules[this.currentPolicy],
      version: this.policyVersion
    };
  },

  /**
   * Check if airgap enforcement is enabled
   */
  isAirgapEnforced() {
    return this.rules[this.currentPolicy].enableAirgapEnforcement;
  },

  /**
   * Check if unsigned imports are allowed
   */
  allowsUnsignedImports() {
    return this.rules[this.currentPolicy].allowUnsignedImports;
  },

  /**
   * Get minimum confidence threshold
   */
  getMinConfidenceThreshold() {
    return this.rules[this.currentPolicy].minConfidenceThreshold;
  },

  /**
   * Log policy actions
   */
  log(message) {
    console.log(`[POLICY_GUARD] ${message}`);
    if (typeof window !== 'undefined' && window.hyper && window.hyper.logEvidence) {
      window.hyper.logEvidence(message);
    }
  },

  /**
   * Generate policy report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      policyVersion: this.policyVersion,
      currentPolicy: this.currentPolicy,
      settings: this.rules[this.currentPolicy],
      patternsCount: {
        premium: this.patterns.premium.length,
        login: this.patterns.login.length,
        drm: this.patterns.drm.length,
        subscription: this.patterns.subscription.length
      }
    };
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PolicyGuard;
} else {
  window.PolicyGuard = PolicyGuard;
}
