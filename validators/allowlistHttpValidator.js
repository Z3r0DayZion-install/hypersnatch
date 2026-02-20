// ==================== ALLOWLIST HTTP VALIDATOR ====================
"use strict";

// Allowlist validator - requires explicit enable and allowlist
const AllowlistHttpValidator = {
  name: 'allowlistHttp',
  
  async validate(candidate, config = {}) {
    const result = {
      status: 'detected',
      statusReason: 'Allowlist validation - checking...',
      validation: {
        validatedAt: new Date().toISOString(),
        checks: []
      }
    };
    
    const checks = [];
    
    // Check 1: Allowlist enabled
    const allowlistEnabled = config.allowlistEnabled !== false;
    const enabledCheck = {
      name: 'allowlist_enabled',
      pass: allowlistEnabled,
      info: allowlistEnabled ? 'Allowlist validation enabled' : 'Allowlist validation disabled'
    };
    checks.push(enabledCheck);
    
    if (!allowlistEnabled) {
      result.status = 'blocked';
      result.statusReason = 'Allowlist validation disabled - access blocked';
      result.validation.checks = checks;
      return result;
    }
    
    // Check 2: URL format
    const urlCheck = {
      name: 'url_format',
      pass: candidate.url && candidate.url.startsWith('http'),
      info: candidate.url && candidate.url.startsWith('http') ? 'Valid URL format' : 'Invalid URL format'
    };
    checks.push(urlCheck);
    
    // Check 3: Host in allowlist
    const allowedHosts = config.allowedHosts || [];
    const url = new URL(candidate.url);
    const hostCheck = {
      name: 'host_in_allowlist',
      pass: allowedHosts.includes(url.hostname),
      info: allowedHosts.includes(url.hostname) ? `Host ${url.hostname} is allowed` : `Host ${url.hostname} not in allowlist`
    };
    checks.push(hostCheck);
    
    // Check 4: Network request (only if allowlisted)
    let requestCheck = {
      name: 'network_request',
      pass: false,
      info: 'Skipped - not in allowlist'
    };
    
    if (allowedHosts.includes(url.hostname)) {
      try {
        const response = await fetch(candidate.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000)
        });
        
        requestCheck = {
          name: 'network_request',
          pass: response.ok,
          info: `HTTP ${response.status} - ${response.statusText}`
        };
        
        // Check 5: Content-type validation
        const contentType = response.headers.get('content-type');
        const allowedTypes = config.allowedContentTypes || ['text/html', 'application/json', 'text/plain'];
        const contentTypeCheck = {
          name: 'content_type',
          pass: !contentType || allowedTypes.some(type => contentType.includes(type)),
          info: contentType || 'No content-type header'
        };
        checks.push(contentTypeCheck);
        
      } catch (error) {
        requestCheck = {
          name: 'network_request',
          pass: false,
          info: `Request failed: ${error.message}`
        };
      }
    }
    
    checks.push(requestCheck);
    
    // Determine overall status
    const allPassed = checks.every(check => check.pass);
    
    if (allPassed) {
      result.status = 'validated';
      result.statusReason = 'Allowlist validation - all checks passed';
    } else {
      result.status = 'blocked';
      result.statusReason = 'Allowlist validation - access blocked';
    }
    
    result.validation.checks = checks;
    
    return result;
  }
};

module.exports = AllowlistHttpValidator;
