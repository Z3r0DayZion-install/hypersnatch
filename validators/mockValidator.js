// ==================== MOCK VALIDATOR ====================
"use strict";

// Mock validator for testing - no network calls, deterministic results
const MockValidator = {
  name: 'mock',
  
  async validate(candidate, config = {}) {
    const result = {
      status: 'detected',
      statusReason: 'Mock validation - deterministic test result',
      validation: {
        validatedAt: new Date().toISOString(),
        checks: []
      }
    };
    
    // Deterministic mock validation based on candidate properties
    const checks = [];
    
    // Check 1: URL format
    const urlCheck = {
      name: 'url_format',
      pass: candidate.url && candidate.url.startsWith('http'),
      info: candidate.url && candidate.url.startsWith('http') ? 'Valid URL format' : 'Invalid URL format'
    };
    checks.push(urlCheck);
    
    // Check 2: Host validation (mock allowlist)
    const allowedHosts = config.mockAllowedHosts || ['localhost', '127.0.0.1', 'example.com'];
    const hostCheck = {
      name: 'host_allowed',
      pass: candidate.host && allowedHosts.includes(candidate.host),
      info: candidate.host && allowedHosts.includes(candidate.host) ? 'Host is allowed' : 'Host not in allowlist'
    };
    checks.push(hostCheck);
    
    // Check 3: Confidence threshold
    const confidenceCheck = {
      name: 'confidence_threshold',
      pass: (candidate.confidence || 0) >= 0.5,
      info: `Confidence ${(candidate.confidence || 0).toFixed(2)} meets threshold`
    };
    checks.push(confidenceCheck);
    
    // Check 4: Method validation
    const allowedMethods = config.mockAllowedMethods || ['v2-pattern-extraction', 'generic-extraction'];
    const methodCheck = {
      name: 'method_allowed',
      pass: candidate.method && allowedMethods.includes(candidate.method),
      info: candidate.method && allowedMethods.includes(candidate.method) ? 'Method is allowed' : 'Method not allowed'
    };
    checks.push(methodCheck);
    
    // Determine overall status
    const allPassed = checks.every(check => check.pass);
    
    if (allPassed) {
      result.status = 'validated';
      result.statusReason = 'Mock validation - all checks passed';
    } else {
      result.status = 'blocked';
      result.statusReason = 'Mock validation - some checks failed';
    }
    
    result.validation.checks = checks;
    
    return result;
  }
};

module.exports = MockValidator;
