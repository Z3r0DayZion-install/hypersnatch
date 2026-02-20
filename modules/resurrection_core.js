/**
 * Resurrection Core Module
 * Core link resurrection engine for HyperSnatch Platform
 */

const ResurrectionCore = {
  // Module metadata
  name: 'resurrection_core',
  version: '1.0.0',
  description: 'Core link resurrection and candidate scoring engine',
  
  // Core state
  initialized: false,
  candidates: [],
  confidenceScores: [],
  detectedMarkers: [],
  
  /**
   * Initialize the resurrection core
   */
  initialize() {
    if (this.initialized) return true;
    
    try {
      this.candidates = [];
      this.confidenceScores = [];
      this.detectedMarkers = [];
      this.initialized = true;
      
      this.log('[CORE] Resurrection core initialized');
      return true;
    } catch (error) {
      this.log(`[ERROR] Failed to initialize resurrection core: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Main resurrection engine API
   */
  async run(options = {}) {
    const {
      sourceType = 'HTML',
      rawInput = '',
      policyState = 'strict'
    } = options;
    
    try {
      this.log(`[ENGINE] Processing ${sourceType} input with policy: ${policyState}`);
      
      // Clear previous results
      this.candidates = [];
      this.confidenceScores = [];
      this.detectedMarkers = [];
      
      // Parse input based on source type
      let parsedData = this.parseInput(sourceType, rawInput);
      
      // Extract candidates
      this.candidates = this.extractCandidates(parsedData);
      
      // Score candidates
      this.confidenceScores = this.scoreCandidates(this.candidates, policyState);
      
      // Detect policy markers
      this.detectedMarkers = this.detectMarkers(parsedData);
      
      // Apply policy filtering
      const filteredResults = this.applyPolicyFilter({
        candidates: this.candidates,
        confidenceScores: this.confidenceScores,
        detectedMarkers: this.detectedMarkers,
        policyState
      });
      
      const result = {
        candidates: filteredResults.candidates,
        confidenceScores: filteredResults.confidenceScores,
        refusal: filteredResults.refusal,
        refusalReason: filteredResults.refusalReason,
        detectedMarkers: this.detectedMarkers,
        engineVersion: 'RES-CORE-01',
        processedAt: new Date().toISOString(),
        sourceType,
        inputSize: rawInput.length
      };
      
      this.log(`[ENGINE] Processing complete. Found ${result.candidates.length} candidates`);
      return result;
      
    } catch (error) {
      this.log(`[ERROR] Engine processing failed: ${error.message}`);
      return {
        candidates: [],
        confidenceScores: [],
        refusal: true,
        refusalReason: `Engine error: ${error.message}`,
        detectedMarkers: [],
        engineVersion: 'RES-CORE-01',
        processedAt: new Date().toISOString(),
        sourceType,
        error: true
      };
    }
  },
  
  /**
   * Parse input based on source type
   */
  parseInput(sourceType, rawInput) {
    switch (sourceType.toUpperCase()) {
      case 'HTML':
        return this.parseHTML(rawInput);
      case 'HAR':
        return this.parseHAR(rawInput);
      case 'URL':
        return this.parseURL(rawInput);
      default:
        throw new Error(`Unsupported source type: ${sourceType}`);
    }
  },
  
  /**
   * Parse HTML input
   */
  parseHTML(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      return {
        type: 'html',
        document: doc,
        title: doc.title || '',
        links: this.extractLinks(doc),
        forms: this.extractForms(doc),
        scripts: this.extractScripts(doc),
        metadata: this.extractMetadata(doc)
      };
    } catch (error) {
      throw new Error(`HTML parsing failed: ${error.message}`);
    }
  },
  
  /**
   * Parse HAR input
   */
  parseHAR(harString) {
    try {
      const har = JSON.parse(harString);
      
      if (!har.log || !har.log.entries) {
        throw new Error('Invalid HAR format');
      }
      
      return {
        type: 'har',
        version: har.log.version,
        entries: har.log.entries,
        pages: har.log.pages || [],
        links: this.extractLinksFromHAR(har.log.entries),
        responses: this.extractResponsesFromHAR(har.log.entries)
      };
    } catch (error) {
      throw new Error(`HAR parsing failed: ${error.message}`);
    }
  },
  
  /**
   * Parse URL input
   */
  parseURL(url) {
    try {
      const urlObj = new URL(url);
      
      return {
        type: 'url',
        url: url,
        domain: urlObj.hostname,
        path: urlObj.pathname,
        protocol: urlObj.protocol,
        search: urlObj.search,
        hash: urlObj.hash
      };
    } catch (error) {
      throw new Error(`URL parsing failed: ${error.message}`);
    }
  },
  
  /**
   * Extract link candidates
   */
  extractCandidates(parsedData) {
    const candidates = [];
    
    switch (parsedData.type) {
      case 'html':
        candidates.push(...this.extractLinkCandidates(parsedData));
        break;
      case 'har':
        candidates.push(...this.extractHARCandidates(parsedData));
        break;
      case 'url':
        candidates.push(...this.extractURLCandidates(parsedData));
        break;
    }
    
    return candidates;
  },
  
  /**
   * Extract link candidates from HTML
   */
  extractLinkCandidates(htmlData) {
    const candidates = [];
    const { document } = htmlData;
    
    // Extract all links
    const links = document.querySelectorAll('a[href]');
    links.forEach((link, index) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim() || '';
      const title = link.getAttribute('title') || '';
      
      if (href && !href.startsWith('#')) {
        candidates.push({
          id: `link_${index}`,
          type: 'link',
          url: href,
          text: text,
          title: title,
          element: link.tagName,
          visible: this.isVisible(link),
          depth: this.getElementDepth(link)
        });
      }
    });
    
    // Extract form actions
    const forms = document.querySelectorAll('form[action]');
    forms.forEach((form, index) => {
      const action = form.getAttribute('action');
      const method = form.getAttribute('method') || 'GET';
      
      if (action) {
        candidates.push({
          id: `form_${index}`,
          type: 'form',
          url: action,
          method: method,
          element: form.tagName,
          inputs: form.querySelectorAll('input').length
        });
      }
    });
    
    return candidates;
  },
  
  /**
   * Extract candidates from HAR
   */
  extractHARCandidates(harData) {
    const candidates = [];
    const { entries } = harData;
    
    entries.forEach((entry, index) => {
      const url = entry.request?.url;
      if (url) {
        candidates.push({
          id: `har_${index}`,
          type: 'har_request',
          url: url,
          method: entry.request?.method || 'GET',
          status: entry.response?.status || 0,
          size: entry.response?.bodySize || 0,
          mimeType: entry.response?.mimeType || ''
        });
      }
    });
    
    return candidates;
  },
  
  /**
   * Extract candidates from URL
   */
  extractURLCandidates(urlData) {
    return [{
      id: 'url_0',
      type: 'url',
      url: urlData.url,
      domain: urlData.domain,
      path: urlData.path
    }];
  },
  
  /**
   * Score candidates based on confidence
   */
  scoreCandidates(candidates, policyState) {
    return candidates.map(candidate => {
      let score = 0.5; // Base score
      
      // URL pattern scoring
      if (candidate.url) {
        if (candidate.url.startsWith('http')) score += 0.2;
        if (candidate.url.includes('://')) score += 0.1;
        if (!candidate.url.includes('javascript:')) score += 0.1;
      }
      
      // Element visibility scoring
      if (candidate.visible !== undefined) {
        score += candidate.visible ? 0.2 : -0.1;
      }
      
      // Text content scoring
      if (candidate.text && candidate.text.length > 0) {
        score += Math.min(candidate.text.length / 100, 0.2);
      }
      
      // Policy adjustments
      if (policyState === 'strict') {
        score *= 0.8; // Reduce confidence in strict mode
      }
      
      return Math.max(0, Math.min(1, score));
    });
  },
  
  /**
   * Detect policy markers
   */
  detectMarkers(parsedData) {
    const markers = [];
    
    // Check for premium content indicators
    const premiumPatterns = [
      /premium/i,
      /subscribe/i,
      /paywall/i,
      /membership/i,
      /exclusive/i
    ];
    
    const content = this.extractTextContent(parsedData);
    premiumPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        markers.push({
          type: 'premium_indicator',
          pattern: pattern.source,
          confidence: 0.7
        });
      }
    });
    
    // Check for login requirements
    const loginPatterns = [
      /login/i,
      /sign.?in/i,
      /authenticate/i,
      /credentials/i
    ];
    
    loginPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        markers.push({
          type: 'login_required',
          pattern: pattern.source,
          confidence: 0.6
        });
      }
    });
    
    return markers;
  },
  
  /**
   * Apply policy filtering
   */
  applyPolicyFilter(data) {
    const { candidates, confidenceScores, detectedMarkers, policyState } = data;
    
    let refusal = false;
    let refusalReason = null;
    
    // Check for policy violations
    if (policyState === 'strict') {
      const hasPremiumMarkers = detectedMarkers.some(m => m.type === 'premium_indicator');
      const hasLoginMarkers = detectedMarkers.some(m => m.type === 'login_required');
      
      if (hasPremiumMarkers || hasLoginMarkers) {
        refusal = true;
        refusalReason = 'Policy violation: Premium or login-protected content detected';
      }
    }
    
    // Filter candidates based on confidence
    const minConfidence = policyState === 'strict' ? 0.6 : 0.3;
    const filteredCandidates = [];
    const filteredScores = [];
    
    candidates.forEach((candidate, index) => {
      if (confidenceScores[index] >= minConfidence) {
        filteredCandidates.push(candidate);
        filteredScores.push(confidenceScores[index]);
      }
    });
    
    return {
      candidates: filteredCandidates,
      confidenceScores: filteredScores,
      refusal,
      refusalReason
    };
  },
  
  // Helper methods
  extractLinks(doc) {
    return Array.from(doc.querySelectorAll('a[href]')).map(a => a.getAttribute('href'));
  },
  
  extractForms(doc) {
    return Array.from(doc.querySelectorAll('form[action]')).map(f => f.getAttribute('action'));
  },
  
  extractScripts(doc) {
    return Array.from(doc.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
  },
  
  extractMetadata(doc) {
    const metadata = {};
    const metaTags = doc.querySelectorAll('meta');
    metaTags.forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });
    return metadata;
  },
  
  extractLinksFromHAR(entries) {
    return entries.map(entry => entry.request?.url).filter(Boolean);
  },
  
  extractResponsesFromHAR(entries) {
    return entries.map(entry => ({
      url: entry.request?.url,
      status: entry.response?.status,
      size: entry.response?.bodySize
    }));
  },
  
  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  },
  
  getElementDepth(element) {
    let depth = 0;
    let parent = element.parentElement;
    while (parent) {
      depth++;
      parent = parent.parentElement;
    }
    return depth;
  },
  
  extractTextContent(parsedData) {
    if (parsedData.type === 'html') {
      return parsedData.document.body?.textContent || '';
    } else if (parsedData.type === 'har') {
      return parsedData.entries.map(e => e.request?.url || '').join(' ');
    } else if (parsedData.type === 'url') {
      return parsedData.url;
    }
    return '';
  },
  
  log(message) {
    console.log(`[RESURRECTION_CORE] ${message}`);
    if (window.hyper && window.hyper.logEvidence) {
      window.hyper.logEvidence(message);
    }
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResurrectionCore;
} else {
  window.ResurrectionCore = ResurrectionCore;
}
