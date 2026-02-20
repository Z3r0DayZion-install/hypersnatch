/**
 * Email Link Extraction Strategy v1.0
 * Extracts and validates email links from HTML content
 */

const EmailLinkStrategy = {
  // Strategy metadata
  name: 'emload_v1',
  version: '1.0.0',
  description: 'Email link extraction and validation strategy',
  
  /**
   * Process input to extract email links
   */
  process(input, context = {}) {
    try {
      const { content, sourceType } = input;
      const results = {
        strategy: this.name,
        processedAt: context.timestamp || new Date().toISOString(),
        links: [],
        statistics: {
          totalLinks: 0,
          emailLinks: 0,
          unsubscribeLinks: 0,
          trackingLinks: 0
        }
      };
      
      // Parse content based on source type
      let parsedContent;
      if (sourceType === 'html') {
        parsedContent = this.parseHTML(content);
      } else if (sourceType === 'text') {
        parsedContent = this.parseText(content);
      } else {
        throw new Error(`Unsupported source type: ${sourceType}`);
      }
      
      // Extract email links
      const emailLinks = this.extractEmailLinks(parsedContent);
      results.links.push(...emailLinks);
      
      // Extract unsubscribe links
      const unsubscribeLinks = this.extractUnsubscribeLinks(parsedContent);
      results.links.push(...unsubscribeLinks);
      
      // Detect tracking parameters
      const trackingLinks = this.detectTrackingParameters(results.links);
      results.links = trackingLinks;
      
      // Update statistics
      results.statistics.totalLinks = results.links.length;
      results.statistics.emailLinks = emailLinks.length;
      results.statistics.unsubscribeLinks = unsubscribeLinks.length;
      results.statistics.trackingLinks = results.links.filter(l => l.hasTracking).length;
      
      // Validate and score links
      results.links = this.scoreLinks(results.links);
      
      return results;
      
    } catch (error) {
      context.console.error(`Email link processing failed: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Validate input
   */
  validate(input) {
    if (!input || typeof input !== 'object') {
      return false;
    }
    
    if (!input.content || typeof input.content !== 'string') {
      return false;
    }
    
    if (!input.sourceType || !['html', 'text'].includes(input.sourceType)) {
      return false;
    }
    
    return true;
  },
  
  /**
   * Get strategy metadata
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      capabilities: [
        'email_link_extraction',
        'unsubscribe_detection',
        'tracking_parameter_analysis',
        'link_validation'
      ],
      supportedTypes: ['html', 'text'],
      maxInputSize: '10MB'
    };
  },
  
  /**
   * Parse HTML content
   */
  parseHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    return {
      type: 'html',
      document: doc,
      title: doc.title || '',
      links: Array.from(doc.querySelectorAll('a[href]')).map(a => ({
        href: a.getAttribute('href'),
        text: a.textContent?.trim() || '',
        title: a.getAttribute('title') || '',
        className: a.className || ''
      })),
      text: doc.body?.textContent || ''
    };
  },
  
  /**
   * Parse text content
   */
  parseText(text) {
    // Extract URLs from plain text
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const urls = text.match(urlRegex) || [];
    
    return {
      type: 'text',
      text: text,
      links: urls.map(url => ({
        href: url,
        text: '',
        title: '',
        className: ''
      }))
    };
  },
  
  /**
   * Extract email links
   */
  extractEmailLinks(parsedContent) {
    const emailLinks = [];
    const emailRegex = /mailto:([^\s<>"{}|\\^`\[\]]+)/gi;
    
    parsedContent.links.forEach((link, index) => {
      const match = emailRegex.exec(link.href);
      if (match) {
        const email = match[1];
        
        emailLinks.push({
          id: `email_${index}`,
          type: 'email',
          url: link.href,
          email: email,
          text: link.text,
          title: link.title,
          domain: this.extractDomain(email),
          isValid: this.validateEmail(email),
          confidence: this.calculateEmailConfidence(email, link),
          hasTracking: false,
          metadata: {
            extractedAt: new Date().toISOString(),
            sourceIndex: index
          }
        });
      }
    });
    
    return emailLinks;
  },
  
  /**
   * Extract unsubscribe links
   */
  extractUnsubscribeLinks(parsedContent) {
    const unsubscribeLinks = [];
    const unsubscribePatterns = [
      /unsubscribe/i,
      /opt.?out/i,
      /preferences/i,
      /manage.?subscription/i,
      /email.?preferences/i,
      /notification.?settings/i
    ];
    
    parsedContent.links.forEach((link, index) => {
      const textToCheck = `${link.text} ${link.title} ${link.className}`.toLowerCase();
      
      const isUnsubscribe = unsubscribePatterns.some(pattern => 
        pattern.test(textToCheck) || pattern.test(link.href.toLowerCase())
      );
      
      if (isUnsubscribe) {
        unsubscribeLinks.push({
          id: `unsubscribe_${index}`,
          type: 'unsubscribe',
          url: link.href,
          text: link.text,
          title: link.title,
          domain: this.extractDomain(link.href),
          confidence: this.calculateUnsubscribeConfidence(link, textToCheck),
          hasTracking: this.hasTrackingParameters(link.href),
          metadata: {
            extractedAt: new Date().toISOString(),
            sourceIndex: index,
            matchedPatterns: unsubscribePatterns.filter(p => p.test(textToCheck)).map(p => p.source)
          }
        });
      }
    });
    
    return unsubscribeLinks;
  },
  
  /**
   * Detect tracking parameters
   */
  detectTrackingParameters(links) {
    return links.map(link => ({
      ...link,
      hasTracking: this.hasTrackingParameters(link.url),
      trackingParams: this.extractTrackingParameters(link.url)
    }));
  },
  
  /**
   * Check if URL has tracking parameters
   */
  hasTrackingParameters(url) {
    const trackingParams = [
      'utm_', 'fbclid', 'gclid', 'mc_eid', 'source', 'campaign', 
      'medium', 'term', 'content', 'ref', 'referer', 'click_id',
      'subid', 'affiliate', 'partner', 'tracking', 'pixel'
    ];
    
    try {
      const urlObj = new URL(url);
      const params = Array.from(urlObj.searchParams.keys());
      
      return trackingParams.some(param => 
        params.some(p => p.toLowerCase().includes(param.toLowerCase()))
      );
    } catch {
      return false;
    }
  },
  
  /**
   * Extract tracking parameters
   */
  extractTrackingParameters(url) {
    const trackingParams = [];
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.forEach((value, key) => {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('utm') || 
            keyLower.includes('fbclid') || 
            keyLower.includes('gclid') ||
            keyLower.includes('track') ||
            keyLower.includes('campaign') ||
            keyLower.includes('source')) {
          trackingParams.push({ key, value });
        }
      });
    } catch {
      // Invalid URL, ignore
    }
    
    return trackingParams;
  },
  
  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * Extract domain from URL or email
   */
  extractDomain(input) {
    try {
      if (input.includes('@')) {
        // Email address
        return input.split('@')[1].toLowerCase();
      } else {
        // URL
        const urlObj = new URL(input);
        return urlObj.hostname.toLowerCase();
      }
    } catch {
      return 'unknown';
    }
  },
  
  /**
   * Calculate confidence score for email links
   */
  calculateEmailConfidence(email, link) {
    let confidence = 0.5;
    
    // Valid email format
    if (this.validateEmail(email)) {
      confidence += 0.3;
    }
    
    // Has descriptive text
    if (link.text && link.text.length > 3) {
      confidence += 0.1;
    }
    
    // Common email domains
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = this.extractDomain(email);
    if (commonDomains.includes(domain)) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  },
  
  /**
   * Calculate confidence score for unsubscribe links
   */
  calculateUnsubscribeConfidence(link, textToCheck) {
    let confidence = 0.5;
    
    // Strong unsubscribe indicators
    if (textToCheck.includes('unsubscribe')) {
      confidence += 0.3;
    }
    
    // Multiple indicators
    const indicators = ['unsubscribe', 'opt.out', 'preferences', 'manage'];
    const matchCount = indicators.filter(ind => textToCheck.includes(ind)).length;
    confidence += matchCount * 0.1;
    
    // HTTPS URL
    if (link.href.startsWith('https://')) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  },
  
  /**
   * Score all links
   */
  scoreLinks(links) {
    return links.map(link => ({
      ...link,
      score: this.calculateOverallScore(link)
    })).sort((a, b) => b.score - a.score);
  },
  
  /**
   * Calculate overall score for a link
   */
  calculateOverallScore(link) {
    let score = link.confidence || 0.5;
    
    // Penalize tracking links
    if (link.hasTracking) {
      score -= 0.1;
    }
    
    // Boost high-confidence types
    if (link.type === 'email' && link.isValid) {
      score += 0.2;
    }
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(1, score));
  }
};

// Export strategy
if (typeof exports !== 'undefined') {
  exports.default = EmailLinkStrategy;
  exports.process = EmailLinkStrategy.process;
  exports.validate = EmailLinkStrategy.validate;
  exports.getMetadata = EmailLinkStrategy.getMetadata;
}
