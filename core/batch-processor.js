/**
 * HyperSnatch Batch Processor
 * Handles multi-link input processing with progress tracking
 */

class BatchProcessor {
  constructor(options = {}) {
    this.options = {
      maxConcurrency: options.maxConcurrency || 5,
      progressCallback: options.progressCallback || null,
      itemCallback: options.itemCallback || null,
      completeCallback: options.completeCallback || null,
      errorCallback: options.errorCallback || null,
      ...options
    };
    
    this.queue = [];
    this.processing = false;
    this.completed = 0;
    this.failed = 0;
    this.results = [];
    this.errors = [];
  }

  /**
   * Add items to batch queue
   * @param {Array} items - Array of input items
   */
  addItems(items) {
    if (!Array.isArray(items)) {
      items = [items];
    }
    
    // Normalize and deduplicate items
    const normalizedItems = items.map(item => this.normalizeItem(item));
    const uniqueItems = this.deduplicateItems(normalizedItems);
    
    this.queue.push(...uniqueItems);
    return this.queue.length;
  }

  /**
   * Normalize input item
   * @param {string} item - Raw input item
   * @returns {Object} Normalized item
   */
  normalizeItem(item) {
    const trimmed = item.trim();
    const type = this.detectInputType(trimmed);
    
    return {
      id: this.generateId(trimmed),
      raw: trimmed,
      normalized: this.normalizeUrl(trimmed),
      type: type,
      status: 'pending',
      result: null,
      error: null,
      timestamp: Date.now()
    };
  }

  /**
   * Detect input type
   * @param {string} input - Input string
   * @returns {string} Input type
   */
  detectInputType(input) {
    if (this.isHAR(input)) return 'har';
    if (this.isHTML(input)) return 'html';
    if (this.isURL(input)) return 'url';
    return 'text';
  }

  /**
   * Check if input is HAR format
   * @param {string} input - Input string
   * @returns {boolean}
   */
  isHAR(input) {
    try {
      const parsed = JSON.parse(input);
      return parsed && parsed.log && parsed.log.entries;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if input is HTML
   * @param {string} input - Input string
   * @returns {boolean}
   */
  isHTML(input) {
    return /<[^>]+>/i.test(input) && input.includes('<');
  }

  /**
   * Check if input is URL
   * @param {string} input - Input string
   * @returns {boolean}
   */
  isURL(input) {
    try {
      new URL(input);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Normalize URL
   * @param {string} url - URL to normalize
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Remove tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];
      trackingParams.forEach(param => urlObj.searchParams.delete(param));
      
      // Ensure proper protocol
      if (!urlObj.protocol || !['http:', 'https:'].includes(urlObj.protocol)) {
        urlObj.protocol = 'https:';
      }
      
      // Remove fragment
      urlObj.hash = '';
      
      return urlObj.toString();
    } catch (e) {
      return url;
    }
  }

  /**
   * Deduplicate items
   * @param {Array} items - Array of items
   * @returns {Array} Deduplicated items
   */
  deduplicateItems(items) {
    const seen = new Set();
    return items.filter(item => {
      const key = item.normalized.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate unique ID for item
   * @param {string} item - Item content
   * @returns {string} Unique ID
   */
  generateId(item) {
    // Simple hash function for ID generation
    let hash = 0;
    for (let i = 0; i < item.length; i++) {
      const char = item.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Start batch processing
   */
  async start() {
    if (this.processing) {
      throw new Error('Batch processing already in progress');
    }
    
    this.processing = true;
    this.completed = 0;
    this.failed = 0;
    this.results = [];
    this.errors = [];
    
    // Update progress
    this.updateProgress();
    
    // Process items with concurrency control
    const promises = [];
    const concurrency = Math.min(this.options.maxConcurrency, this.queue.length);
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.processItems());
    }
    
    try {
      await Promise.all(promises);
      
      if (this.options.completeCallback) {
        this.options.completeCallback({
          total: this.queue.length,
          completed: this.completed,
          failed: this.failed,
          results: this.results,
          errors: this.errors
        });
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process items from queue
   */
  async processItems() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        item.status = 'processing';
        this.updateProgress();
        
        const result = await this.processItem(item);
        
        item.status = 'completed';
        item.result = result;
        this.results.push(result);
        this.completed++;
        
        if (this.options.itemCallback) {
          this.options.itemCallback(item);
        }
      } catch (error) {
        item.status = 'failed';
        item.error = error.message;
        this.errors.push({ item, error: error.message });
        this.failed++;
        
        if (this.options.errorCallback) {
          this.options.errorCallback(item, error);
        }
      }
      
      this.updateProgress();
    }
  }

  /**
   * Process individual item
   * @param {Object} item - Item to process
   * @returns {Promise<Object>} Processing result
   */
  async processItem(item) {
    // This would integrate with the existing HyperSnatch engine
    // For now, return a mock result
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
    
    return {
      id: item.id,
      input: item.normalized,
      type: item.type,
      candidates: this.generateMockCandidates(item),
      timestamp: Date.now()
    };
  }

  /**
   * Generate mock candidates for testing
   * @param {Object} item - Input item
   * @returns {Array} Mock candidates
   */
  generateMockCandidates(item) {
    const candidates = [];
    
    if (item.type === 'url') {
      candidates.push({
        url: item.normalized,
        confidence: 0.9,
        method: 'direct',
        host: new URL(item.normalized).hostname,
        type: 'direct'
      });
    } else if (item.type === 'html') {
      // Extract URLs from HTML
      const urlRegex = /https?:\/\/[^\s<>"']+/g;
      const matches = item.raw.match(urlRegex) || [];
      
      matches.forEach((url, index) => {
        candidates.push({
          url: url,
          confidence: 0.7 - (index * 0.1),
          method: 'dom',
          host: new URL(url).hostname,
          type: 'extracted'
        });
      });
    }
    
    return candidates;
  }

  /**
   * Update progress
   */
  updateProgress() {
    if (this.options.progressCallback) {
      const total = this.queue.length + this.completed + this.failed;
      const progress = {
        total: total,
        completed: this.completed,
        failed: this.failed,
        processing: this.processing,
        percentage: total > 0 ? ((this.completed + this.failed) / total) * 100 : 0
      };
      
      this.options.progressCallback(progress);
    }
  }

  /**
   * Get current status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      processing: this.processing,
      queue: this.queue.length,
      completed: this.completed,
      failed: this.failed,
      total: this.queue.length + this.completed + this.failed
    };
  }

  /**
   * Clear queue and reset
   */
  reset() {
    if (this.processing) {
      throw new Error('Cannot reset while processing is active');
    }
    
    this.queue = [];
    this.completed = 0;
    this.failed = 0;
    this.results = [];
    this.errors = [];
  }

  /**
   * Get results summary
   * @returns {Object} Results summary
   */
  getResultsSummary() {
    return {
      total: this.queue.length + this.completed + this.failed,
      completed: this.completed,
      failed: this.failed,
      successRate: this.queue.length + this.completed + this.failed > 0 
        ? (this.completed / (this.queue.length + this.completed + this.failed)) * 100 
        : 0,
      results: this.results,
      errors: this.errors
    };
  }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BatchProcessor;
} else if (typeof window !== 'undefined') {
  window.BatchProcessor = BatchProcessor;
}
