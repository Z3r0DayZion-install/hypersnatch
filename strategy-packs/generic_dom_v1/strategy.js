/**
 * Generic DOM Analysis Strategy v1.0
 * General-purpose DOM analysis and link extraction strategy
 */

const GenericDOMStrategy = {
  // Strategy metadata
  name: 'generic_dom_v1',
  version: '1.0.0',
  description: 'Generic DOM analysis and link extraction strategy',
  
  /**
   * Process input to analyze DOM and extract links
   */
  process(input, context = {}) {
    try {
      const { content, sourceType } = input;
      const results = {
        strategy: this.name,
        processedAt: context.timestamp || new Date().toISOString(),
        links: [],
        structure: {},
        statistics: {
          totalLinks: 0,
          internalLinks: 0,
          externalLinks: 0,
          javascriptLinks: 0,
          mailtoLinks: 0,
          telLinks: 0,
          formActions: 0
        }
      };
      
      // Parse content based on source type
      let parsedContent;
      if (sourceType === 'html') {
        parsedContent = this.parseHTML(content);
      } else if (sourceType === 'har') {
        parsedContent = this.parseHAR(content);
      } else {
        throw new Error(`Unsupported source type: ${sourceType}`);
      }
      
      // Analyze document structure
      results.structure = this.analyzeStructure(parsedContent);
      
      // Extract all links
      const allLinks = this.extractAllLinks(parsedContent);
      results.links = allLinks;
      
      // Classify and categorize links
      results.links = this.classifyLinks(results.links, parsedContent);
      
      // Update statistics
      results.statistics = this.calculateStatistics(results.links);
      
      // Score links
      results.links = this.scoreLinks(results.links, results.structure);
      
      return results;
      
    } catch (error) {
      context.console.error(`Generic DOM processing failed: ${error.message}`);
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
    
    if (!input.sourceType || !['html', 'har'].includes(input.sourceType)) {
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
        'dom_analysis',
        'link_extraction',
        'structure_analysis',
        'link_classification',
        'content_pattern_detection'
      ],
      supportedTypes: ['html', 'har'],
      maxInputSize: '20MB'
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
      baseURI: doc.baseURI || '',
      links: Array.from(doc.querySelectorAll('a[href]')).map((a, index) => ({
        index,
        href: a.getAttribute('href'),
        text: a.textContent?.trim() || '',
        title: a.getAttribute('title') || '',
        className: a.className || '',
        id: a.id || '',
        target: a.getAttribute('target') || '',
        rel: a.getAttribute('rel') || '',
        download: a.getAttribute('download') || '',
        visible: this.isVisible(a),
        depth: this.getElementDepth(a),
        parentTag: a.parentElement?.tagName || '',
        siblings: a.parentElement?.children.length || 0
      })),
      forms: Array.from(doc.querySelectorAll('form[action]')).map((f, index) => ({
        index,
        action: f.getAttribute('action'),
        method: f.getAttribute('method') || 'GET',
        enctype: f.getAttribute('enctype') || '',
        className: f.className || '',
        id: f.id || '',
        inputs: f.querySelectorAll('input').length
      })),
      images: Array.from(doc.querySelectorAll('img[src]')).map((img, index) => ({
        index,
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
        title: img.getAttribute('title') || '',
        width: img.getAttribute('width') || '',
        height: img.getAttribute('height') || ''
      })),
      scripts: Array.from(doc.querySelectorAll('script[src]')).map((script, index) => ({
        index,
        src: script.getAttribute('src'),
        type: script.getAttribute('type') || 'text/javascript',
        async: script.hasAttribute('async'),
        defer: script.hasAttribute('defer')
      })),
      metadata: this.extractMetadata(doc),
      text: doc.body?.textContent || ''
    };
  },
  
  /**
   * Parse HAR content
   */
  parseHAR(harString) {
    const har = JSON.parse(harString);
    
    if (!har.log || !har.log.entries) {
      throw new Error('Invalid HAR format');
    }
    
    return {
      type: 'har',
      version: har.log.version,
      entries: har.log.entries.map((entry, index) => ({
        index,
        url: entry.request?.url || '',
        method: entry.request?.method || 'GET',
        status: entry.response?.status || 0,
        mimeType: entry.response?.mimeType || '',
        size: entry.response?.bodySize || 0,
        time: entry.time || 0,
        headers: entry.request?.headers || []
      })),
      pages: har.log.pages || []
    };
  },
  
  /**
   * Analyze document structure
   */
  analyzeStructure(parsedContent) {
    if (parsedContent.type === 'html') {
      const doc = parsedContent.document;
      
      return {
        title: parsedContent.title,
        hasHeadings: doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        hasNavigation: doc.querySelectorAll('nav').length,
        hasHeader: doc.querySelectorAll('header').length,
        hasFooter: doc.querySelectorAll('footer').length,
        hasMain: doc.querySelectorAll('main').length,
        hasSections: doc.querySelectorAll('section').length,
        hasArticles: doc.querySelectorAll('article').length,
        hasAside: doc.querySelectorAll('aside').length,
        totalElements: doc.querySelectorAll('*').length,
        textLength: parsedContent.text.length,
        linkDensity: this.calculateLinkDensity(parsedContent),
        formCount: parsedContent.forms.length,
        imageCount: parsedContent.images.length,
        scriptCount: parsedContent.scripts.length
      };
    } else if (parsedContent.type === 'har') {
      return {
        type: 'har',
        entryCount: parsedContent.entries.length,
        pageCount: parsedContent.pages.length,
        uniqueDomains: this.countUniqueDomains(parsedContent.entries),
        totalSize: parsedContent.entries.reduce((sum, entry) => sum + entry.size, 0),
        averageResponseTime: parsedContent.entries.reduce((sum, entry) => sum + entry.time, 0) / parsedContent.entries.length
      };
    }
    
    return {};
  },
  
  /**
   * Extract all links
   */
  extractAllLinks(parsedContent) {
    const links = [];
    
    if (parsedContent.type === 'html') {
      // Extract anchor links
      parsedContent.links.forEach(link => {
        links.push({
          id: `link_${link.index}`,
          type: 'anchor',
          url: link.href,
          text: link.text,
          title: link.title,
          className: link.className,
          id: link.id,
          target: link.target,
          rel: link.rel,
          download: link.download,
          visible: link.visible,
          depth: link.depth,
          parentTag: link.parentTag,
          siblings: link.siblings,
          metadata: {
            elementIndex: link.index,
            extractedAt: new Date().toISOString()
          }
        });
      });
      
      // Extract form actions
      parsedContent.forms.forEach(form => {
        links.push({
          id: `form_${form.index}`,
          type: 'form',
          url: form.action,
          method: form.method,
          enctype: form.enctype,
          className: form.className,
          id: form.id,
          inputCount: form.inputs,
          metadata: {
            elementIndex: form.index,
            extractedAt: new Date().toISOString()
          }
        });
      });
      
    } else if (parsedContent.type === 'har') {
      // Extract HAR entries
      parsedContent.entries.forEach(entry => {
        links.push({
          id: `har_${entry.index}`,
          type: 'har_request',
          url: entry.url,
          method: entry.method,
          status: entry.status,
          mimeType: entry.mimeType,
          size: entry.size,
          time: entry.time,
          headers: entry.headers,
          metadata: {
            entryIndex: entry.index,
            extractedAt: new Date().toISOString()
          }
        });
      });
    }
    
    return links;
  },
  
  /**
   * Classify links
   */
  classifyLinks(links, parsedContent) {
    const baseURI = parsedContent.baseURI || '';
    
    return links.map(link => {
      const classification = this.classifyLink(link, baseURI);
      
      return {
        ...link,
        classification,
        domain: this.extractDomain(link.url),
        scheme: this.extractScheme(link.url),
        isInternal: classification.isInternal,
        isExternal: classification.isExternal,
        isJavaScript: classification.isJavaScript,
        isMailto: classification.isMailto,
        isTel: classification.isTel,
        hasTracking: this.hasTrackingParameters(link.url)
      };
    });
  },
  
  /**
   * Classify individual link
   */
  classifyLink(link, baseURI) {
    const url = link.url.toLowerCase();
    
    const classification = {
      category: 'unknown',
      isInternal: false,
      isExternal: false,
      isJavaScript: false,
      isMailto: false,
      isTel: false,
      isRelative: false,
      isAbsolute: false
    };
    
    // Check scheme
    if (url.startsWith('javascript:')) {
      classification.category = 'javascript';
      classification.isJavaScript = true;
    } else if (url.startsWith('mailto:')) {
      classification.category = 'email';
      classification.isMailto = true;
    } else if (url.startsWith('tel:')) {
      classification.category = 'telephone';
      classification.isTel = true;
    } else if (url.startsWith('#')) {
      classification.category = 'anchor';
      classification.isRelative = true;
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      classification.isAbsolute = true;
      
      if (baseURI) {
        try {
          const baseDomain = new URL(baseURI).hostname;
          const linkDomain = new URL(link.url).hostname;
          classification.isInternal = baseDomain === linkDomain;
          classification.isExternal = baseDomain !== linkDomain;
        } catch {
          classification.isExternal = true;
        }
      }
      
      classification.category = classification.isExternal ? 'external' : 'internal';
    } else if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      classification.category = 'internal';
      classification.isRelative = true;
      classification.isInternal = true;
    } else {
      classification.category = 'relative';
      classification.isRelative = true;
    }
    
    return classification;
  },
  
  /**
   * Calculate statistics
   */
  calculateStatistics(links) {
    const stats = {
      totalLinks: links.length,
      internalLinks: 0,
      externalLinks: 0,
      javascriptLinks: 0,
      mailtoLinks: 0,
      telLinks: 0,
      formActions: 0
    };
    
    links.forEach(link => {
      if (link.isInternal) stats.internalLinks++;
      if (link.isExternal) stats.externalLinks++;
      if (link.isJavaScript) stats.javascriptLinks++;
      if (link.isMailto) stats.mailtoLinks++;
      if (link.isTel) stats.telLinks++;
      if (link.type === 'form') stats.formActions++;
    });
    
    return stats;
  },
  
  /**
   * Score links
   */
  scoreLinks(links, structure) {
    return links.map(link => {
      let score = 0.5; // Base score
      
      // Visibility bonus
      if (link.visible !== false) {
        score += 0.2;
      }
      
      // Text content bonus
      if (link.text && link.text.length > 0) {
        score += Math.min(link.text.length / 50, 0.2);
      }
      
      // Depth penalty (deeper links are less important)
      if (link.depth > 0) {
        score -= Math.min(link.depth * 0.05, 0.2);
      }
      
      // Scheme preferences
      if (link.scheme === 'https') {
        score += 0.1;
      } else if (link.scheme === 'http') {
        score -= 0.1;
      } else if (link.isJavaScript) {
        score -= 0.2;
      }
      
      // Type preferences
      if (link.type === 'anchor' && link.classification.isInternal) {
        score += 0.1;
      }
      
      // Tracking penalty
      if (link.hasTracking) {
        score -= 0.1;
      }
      
      // Normalize score
      score = Math.max(0, Math.min(1, score));
      
      return {
        ...link,
        score
      };
    }).sort((a, b) => b.score - a.score);
  },
  
  // Helper methods
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
  
  calculateLinkDensity(parsedContent) {
    const linkText = parsedContent.links.map(l => l.text).join(' ').length;
    const totalText = parsedContent.text.length;
    return totalText > 0 ? linkText / totalText : 0;
  },
  
  countUniqueDomains(entries) {
    const domains = new Set();
    entries.forEach(entry => {
      try {
        const url = new URL(entry.url);
        domains.add(url.hostname);
      } catch {
        // Invalid URL, ignore
      }
    });
    return domains.size;
  },
  
  isVisible(element) {
    // Simple visibility check (would be more complex in real implementation)
    return !element.hasAttribute('hidden') && 
           element.style?.display !== 'none' && 
           element.style?.visibility !== 'hidden';
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
  
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  },
  
  extractScheme(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol.replace(':', '');
    } catch {
      return 'unknown';
    }
  },
  
  hasTrackingParameters(url) {
    try {
      const urlObj = new URL(url);
      const params = Array.from(urlObj.searchParams.keys());
      const trackingParams = ['utm_', 'fbclid', 'gclid', 'source', 'campaign', 'ref'];
      return trackingParams.some(param => 
        params.some(p => p.toLowerCase().includes(param.toLowerCase()))
      );
    } catch {
      return false;
    }
  }
};

// Export strategy
if (typeof exports !== 'undefined') {
  exports.default = GenericDOMStrategy;
  exports.process = GenericDOMStrategy.process;
  exports.validate = GenericDOMStrategy.validate;
  exports.getMetadata = GenericDOMStrategy.getMetadata;
}
