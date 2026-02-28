// ==================== HYPER SNATCH HELPERS ====================
// Concrete helper functions for the Link Resurrection Engine

"use strict";

// ==================== URL HELPERS ====================
const URLHelpers = {
  // Extract domain from URL
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return null;
    }
  },

  // Check if URL is from allowed host
  isAllowedHost(url, allowedHosts = []) {
    const domain = this.extractDomain(url);
    if (!domain) return false;
    
    return allowedHosts.some(host => 
      domain === host || domain.endsWith(`.${host}`)
    );
  },

  // Sanitize URL for display
  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove sensitive parameters
      const sanitized = new URL(urlObj);
      sanitized.searchParams.delete('token');
      sanitized.searchParams.delete('key');
      sanitized.searchParams.delete('password');
      sanitized.searchParams.delete('secret');
      return sanitized.toString();
    } catch (e) {
      return url;
    }
  },

  // Generate URL fingerprint for deduplication
  generateFingerprint(url) {
    try {
      const urlObj = new URL(url);
      const fingerprint = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      return fingerprint.toLowerCase();
    } catch (e) {
      return url.toLowerCase();
    }
  }
};

// ==================== DOM HELPERS ====================
const DOMHelpers = {
  // Extract text content safely
  safeTextContent(element) {
    if (!element) return '';
    return element.textContent || element.innerText || '';
  },

  // Find elements by text content
  findByText(root, text, selector = '*') {
    const elements = root.querySelectorAll(selector);
    return Array.from(elements).filter(el => 
      this.safeTextContent(el).toLowerCase().includes(text.toLowerCase())
    );
  },

  // Extract links from DOM
  extractLinks(root) {
    const links = root.querySelectorAll('a[href]');
    return Array.from(links).map(link => ({
      url: link.href,
      text: this.safeTextContent(link),
      title: link.title || '',
      className: link.className || ''
    })).filter(link => link.url && link.url.startsWith('http'));
  },

  // Extract forms with action URLs
  extractForms(root) {
    const forms = root.querySelectorAll('form[action]');
    return Array.from(forms).map(form => ({
      action: form.action,
      method: form.method || 'GET',
      className: form.className || ''
    })).filter(form => form.action && form.action.startsWith('http'));
  },

  // Check if element is visible
  isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  },

  // Get element hierarchy path
  getElementPath(element) {
    if (!element || !element.tagName) return '';
    
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${current.className.split(' ').join('.')}`;
      }
      
      path.unshift(selector);
      current = current.parentNode;
    }
    
    return path.join(' > ');
  }
};

// ==================== STRING HELPERS ====================
const StringHelpers = {
  // Truncate string with ellipsis
  truncate(str, maxLength = 100, suffix = '...') {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  },

  // Escape HTML characters
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Extract URLs from text
  extractUrls(text) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return text.match(urlRegex) || [];
  },

  // Clean and normalize text
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .trim();
  },

  // Check if string contains keywords
  containsKeywords(text, keywords = []) {
    const cleanText = this.cleanText(text).toLowerCase();
    return keywords.some(keyword => 
      cleanText.includes(keyword.toLowerCase())
    );
  }
};

// ==================== VALIDATION HELPERS ====================
const ValidationHelpers = {
  // Validate URL format
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Check if URL is accessible (basic check)
  async checkUrlAccessibility(url, timeout = 5000) {
    return new Promise((resolve) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      fetch(url, { 
        method: 'HEAD', 
        signal: controller.signal,
        mode: 'no-cors'
      })
      .then(() => resolve(true))
      .catch(() => resolve(false))
      .finally(() => clearTimeout(timeoutId));
    });
  },

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Check for suspicious patterns
  hasSuspiciousPatterns(text) {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(text));
  }
};

// ==================== STORAGE HELPERS ====================
const StorageHelpers = {
  // Safe localStorage operations
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('localStorage setItem failed:', e);
      return false;
    }
  },

  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('localStorage getItem failed:', e);
      return defaultValue;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('localStorage removeItem failed:', e);
      return false;
    }
  },

  // Clear expired items
  clearExpired(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith('temp_')) {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.timestamp && (now - parsed.timestamp) > maxAge) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (e) {
      console.warn('localStorage cleanup failed:', e);
    }
  }
};

// ==================== PERFORMANCE HELPERS ====================
const PerformanceHelpers = {
  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Measure execution time
  async measureTime(fn, label = 'Execution') {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${label} took ${(end - start).toFixed(2)} milliseconds`);
    return result;
  },

  // Create lazy loader
  createLazyLoader(loadFn) {
    let loaded = false;
    let data = null;
    
    return async () => {
      if (!loaded) {
        data = await loadFn();
        loaded = true;
      }
      return data;
    };
  }
};

// ==================== EXPORT HELPERS ====================
const ExportHelpers = {
  // Export to JSON
  exportToJson(data, filename = 'export.json', metadata = {}) {
    const content = window.ExportManager.generateJSON(data, metadata);
    window.ExportManager.downloadFile(content, filename, 'application/json');
  },

  // Export to CSV
  exportToCsv(data, filename = 'export.csv') {
    const content = window.ExportManager.generateCSV(data);
    window.ExportManager.downloadFile(content, filename, 'text/csv');
  },

  // Export to Text Report
  exportToText(data, filename = 'report.txt', metadata = {}) {
    const content = window.ExportManager.generateTextReport(data, metadata);
    window.ExportManager.downloadFile(content, filename, 'text/plain');
  },

  // Export to PDF Report
  async exportToPdf(data, metadata = {}) {
    return await window.ExportManager.generatePDFReport(data, metadata);
  },

  // Download blob as file (kept for compatibility)
  downloadBlob(blob, filename) {
    window.ExportManager.downloadFile(blob, filename, blob.type);
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  }
};

// ==================== GLOBAL EXPORT ====================
window.HyperSnatchHelpers = {
  URL: URLHelpers,
  DOM: DOMHelpers,
  String: StringHelpers,
  Validation: ValidationHelpers,
  Storage: StorageHelpers,
  Performance: PerformanceHelpers,
  Export: ExportHelpers
};

// Auto-cleanup expired storage items
StorageHelpers.clearExpired();

console.log('HyperSnatch Helpers loaded');
