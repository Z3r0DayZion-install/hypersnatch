// ==================== LOCAL SERVER VALIDATOR ====================
"use strict";

// Local server validator - only validates against localhost/127.0.0.1
const LocalServerValidator = {
  name: 'localServer',
  
  async validate(candidate, config = {}) {
    const result = {
      status: 'detected',
      statusReason: 'Local server validation - checking...',
      validation: {
        validatedAt: new Date().toISOString(),
        checks: []
      }
    };
    
    const checks = [];
    
    // Check 1: URL format
    const urlCheck = {
      name: 'url_format',
      pass: candidate.url && candidate.url.startsWith('http'),
      info: candidate.url && candidate.url.startsWith('http') ? 'Valid URL format' : 'Invalid URL format'
    };
    checks.push(urlCheck);
    
    // Check 2: Local host only
    const url = new URL(candidate.url);
    const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const hostCheck = {
      name: 'localhost_only',
      pass: isLocalHost,
      info: isLocalHost ? 'Local host allowed' : 'Only localhost allowed'
    };
    checks.push(hostCheck);
    
    // Check 3: Port validation (optional)
    const allowedPorts = config.allowedPorts || [3000, 8000, 8080, 3001];
    const portCheck = {
      name: 'port_allowed',
      pass: !url.port || allowedPorts.includes(parseInt(url.port)),
      info: !url.port || allowedPorts.includes(parseInt(url.port)) ? 'Port allowed' : 'Port not in allowlist'
    };
    checks.push(portCheck);
    
    // Check 4: Network request (only if local host)
    let requestCheck = {
      name: 'network_request',
      pass: false,
      info: 'Skipped - not local host'
    };
    
    if (isLocalHost) {
      try {
        // Only make requests to localhost
        const response = await fetch(candidate.url, {
          method: 'HEAD', // Use HEAD to avoid downloading content
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        requestCheck = {
          name: 'network_request',
          pass: response.ok,
          info: `HTTP ${response.status} - ${response.statusText}`
        };
        
        // Check 5: Content-type (if available)
        const contentType = response.headers.get('content-type');
        const contentTypeCheck = {
          name: 'content_type',
          pass: true, // Accept any content type for local servers
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
      result.statusReason = 'Local server validation - all checks passed';
    } else {
      result.status = 'blocked';
      result.statusReason = 'Local server validation - some checks failed';
    }
    
    result.validation.checks = checks;
    
    return result;
  }
};

module.exports = LocalServerValidator;
