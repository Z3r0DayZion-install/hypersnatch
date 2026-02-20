/**
 * HyperSnatch Input Detector
 * Detects and separates different input types from pasted content
 */

class InputDetector {
  constructor() {
    this.patterns = {
      url: /https?:\/\/[^\s<>"']+/gi,
      har: /^\s*\{[\s\S]*"log"[\s\S]*"entries"[\s\S]*\}\s*$/m,
      html: /<[^>]+>/i,
      multiline: /\n\s*\n/,
      separator: /[-=*_]{3,}/
    };
  }

  /**
   * Detect and parse input content
   * @param {string} content - Raw input content
   * @returns {Array} Array of detected input blocks
   */
  detectAndParse(content) {
    const blocks = this.separateBlocks(content);
    const parsed = [];
    
    for (const block of blocks) {
      const detected = this.detectBlockType(block);
      parsed.push({
        ...detected,
        raw: block,
        id: this.generateBlockId(block)
      });
    }
    
    return parsed;
  }

  /**
   * Separate content into logical blocks
   * @param {string} content - Raw content
   * @returns {Array} Array of content blocks
   */
  separateBlocks(content) {
    const blocks = [];
    
    // Check for explicit separators
    if (this.patterns.separator.test(content)) {
      return content.split(this.patterns.separator)
        .map(block => block.trim())
        .filter(block => block.length > 0);
    }
    
    // Check for HAR format (single block)
    if (this.patterns.har.test(content)) {
      return [content.trim()];
    }
    
    // Check for HTML format (single block)
    if (this.isHTMLBlock(content)) {
      return [content.trim()];
    }
    
    // Split by lines and group related content
    const lines = content.split('\n');
    let currentBlock = '';
    let inCodeBlock = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines unless they're between blocks
      if (!trimmed && currentBlock && !inCodeBlock) {
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
        continue;
      }
      
      // Detect code blocks
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        currentBlock += line + '\n';
        continue;
      }
      
      // Add line to current block
      currentBlock += line + '\n';
    }
    
    // Add final block
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }
    
    return blocks.filter(block => block.length > 0);
  }

  /**
   * Detect type of a single block
   * @param {string} block - Content block
   * @returns {Object} Detection result
   */
  detectBlockType(block) {
    const trimmed = block.trim();
    
    // HAR format
    if (this.patterns.har.test(trimmed)) {
      return {
        type: 'har',
        confidence: 0.95,
        metadata: this.parseHARMetadata(trimmed)
      };
    }
    
    // HTML format
    if (this.isHTMLBlock(trimmed)) {
      return {
        type: 'html',
        confidence: 0.9,
        metadata: this.parseHTMLMetadata(trimmed)
      };
    }
    
    // URL list
    const urls = trimmed.match(this.patterns.url);
    if (urls && urls.length > 0) {
      // If multiple URLs found, treat as URL list
      if (urls.length > 1 || trimmed.split('\n').length > 1) {
        return {
          type: 'url-list',
          confidence: 0.85,
          metadata: {
            urlCount: urls.length,
            urls: urls
          }
        };
      } else {
        // Single URL
        return {
          type: 'url',
          confidence: 0.9,
          metadata: {
            url: urls[0],
            host: this.extractHost(urls[0])
          }
        };
      }
    }
    
    // Text content
    return {
      type: 'text',
      confidence: 0.7,
      metadata: {
        lineCount: trimmed.split('\n').length,
        wordCount: trimmed.split(/\s+/).length,
        hasUrls: urls && urls.length > 0
      }
    };
  }

  /**
   * Check if block is HTML
   * @param {string} block - Content block
   * @returns {boolean}
   */
  isHTMLBlock(block) {
    const trimmed = block.trim();
    
    // Must have HTML tags
    if (!this.patterns.html.test(trimmed)) {
      return false;
    }
    
    // Check for common HTML structures
    const htmlPatterns = [
      /<html/i,
      /<head/i,
      /<body/i,
      /<div/i,
      /<a\s+href/i,
      /<script/i,
      /<link/i
    ];
    
    return htmlPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Parse HAR metadata
   * @param {string} harContent - HAR content
   * @returns {Object} HAR metadata
   */
  parseHARMetadata(harContent) {
    try {
      const har = JSON.parse(harContent);
      const entries = har.log?.entries || [];
      
      return {
        version: har.log?.version || 'unknown',
        entries: entries.length,
        domains: [...new Set(entries.map(entry => new URL(entry.request?.url || '').hostname).filter(Boolean))],
        date: new Date(har.log?.pages?.[0]?.startedDateTime || Date.now()),
        size: JSON.stringify(har).length
      };
    } catch (e) {
      return {
        error: 'Invalid HAR format',
        size: harContent.length
      };
    }
  }

  /**
   * Parse HTML metadata
   * @param {string} htmlContent - HTML content
   * @returns {Object} HTML metadata
   */
  parseHTMLMetadata(htmlContent) {
    const urls = htmlContent.match(this.patterns.url) || [];
    const domains = [...new Set(urls.map(url => this.extractHost(url)).filter(Boolean))];
    
    // Extract title
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Count common elements
    const elementCounts = {
      links: (htmlContent.match(/<a\s+href/gi) || []).length,
      images: (htmlContent.match(/<img\s+src/gi) || []).length,
      scripts: (htmlContent.match(/<script/gi) || []).length,
      forms: (htmlContent.match(/<form/gi) || []).length
    };
    
    return {
      title,
      urlCount: urls.length,
      domains,
      elementCounts,
      size: htmlContent.length
    };
  }

  /**
   * Extract host from URL
   * @param {string} url - URL string
   * @returns {string|null} Hostname
   */
  extractHost(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return null;
    }
  }

  /**
   * Generate block ID
   * @param {string} block - Content block
   * @returns {string} Block ID
   */
  generateBlockId(block) {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < block.length; i++) {
      const char = block.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate detected input
   * @param {Object} detected - Detected input object
   * @returns {Object} Validation result
   */
  validateInput(detected) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    switch (detected.type) {
      case 'har':
        try {
          JSON.parse(detected.raw);
        } catch (e) {
          validation.valid = false;
          validation.errors.push('Invalid JSON format');
        }
        break;
        
      case 'html':
        if (!this.patterns.html.test(detected.raw)) {
          validation.valid = false;
          validation.errors.push('No HTML tags found');
        }
        break;
        
      case 'url':
      case 'url-list':
        const urls = detected.raw.match(this.patterns.url);
        if (!urls || urls.length === 0) {
          validation.valid = false;
          validation.errors.push('No valid URLs found');
        }
        break;
        
      case 'text':
        if (detected.raw.trim().length < 3) {
          validation.valid = false;
          validation.errors.push('Text too short');
        }
        break;
    }
    
    return validation;
  }

  /**
   * Get processing hints for detected input
   * @param {Object} detected - Detected input object
   * @returns {Object} Processing hints
   */
  getProcessingHints(detected) {
    const hints = {
      strategy: 'default',
      options: {}
    };
    
    switch (detected.type) {
      case 'har':
        hints.strategy = 'har-parser';
        hints.options.extractAllUrls = true;
        break;
        
      case 'html':
        hints.strategy = 'dom-parser';
        hints.options.extractLinks = true;
        hints.options.extractForms = true;
        break;
        
      case 'url-list':
        hints.strategy = 'batch-processor';
        hints.options.concurrent = true;
        break;
        
      case 'url':
        hints.strategy = 'single-processor';
        break;
        
      case 'text':
        if (detected.metadata.hasUrls) {
          hints.strategy = 'text-extractor';
          hints.options.extractUrls = true;
        } else {
          hints.strategy = 'text-analyzer';
        }
        break;
    }
    
    return hints;
  }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputDetector;
} else if (typeof window !== 'undefined') {
  window.InputDetector = InputDetector;
}
