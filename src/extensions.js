// ==================== HYPER SNATCH EXTENSIONS ====================
// Extension functions for advanced functionality

"use strict";

// ==================== ANALYSIS EXTENSIONS ====================
const AnalysisExtensions = {
  // Deep content analysis
  analyzeContent(content, options = {}) {
    const analysis = {
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
      lineCount: content.split('\n').length,
      sentences: content.match(/[^.!?]+[.!?]/g) || [],
      keywords: this.extractKeywords(content, options.keywords || []),
      sentiment: this.analyzeSentiment(content),
      readability: this.calculateReadability(content),
      entities: this.extractEntities(content)
    };

    if (options.includeMetadata) {
      analysis.metadata = {
        processedAt: new Date().toISOString(),
        wordFrequency: this.getWordFrequency(content),
        complexity: this.assessComplexity(content)
      };
    }

    return analysis;
  },

  extractKeywords(content, keywordList) {
    const words = content.toLowerCase().split(/\W+/);
    const keywordCounts = {};
    
    keywordList.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      keywordCounts[keyword] = matches ? matches.length : 0;
    });

    return keywordCounts;
  },

  analyzeSentiment(content) {
    const positiveWords = ['good', 'great', 'excellent', 'success', 'valid', 'working', 'complete'];
    const negativeWords = ['bad', 'error', 'fail', 'invalid', 'broken', 'missing', 'wrong'];
    
    const words = content.toLowerCase().split(/\W+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    const score = (positiveCount - negativeCount) / Math.max(words.length, 1);
    
    return {
      score: Math.max(-1, Math.min(1, score)),
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      positive: positiveCount,
      negative: negativeCount,
      total: words.length
    };
  },

  calculateReadability(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\W+/).filter(w => w.length > 0);
    
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgCharsPerWord = words.length > 0 ? content.length / words.length : 0;
    
    // Flesch Reading Ease approximation
    const fleschScore = 206.835 - 1.015 * avgCharsPerWord - 84.6 * (avgWordsPerSentence || 0);
    
    return {
      fleschScore: Math.round(fleschScore * 100) / 100,
      level: fleschScore >= 90 ? 'very easy' : 
              fleschScore >= 80 ? 'easy' :
              fleschScore >= 70 ? 'fairly easy' :
              fleschScore >= 60 ? 'standard' :
              fleschScore >= 50 ? 'fairly difficult' :
              fleschScore >= 30 ? 'difficult' : 'very difficult',
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10
    };
  },

  assessComplexity(content) {
    const sentences = content.split(/[.!?]+/);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    const clauses = content.split(/[,:;]/).filter(c => c.trim().length > 0);
    const avgClauseLength = clauses.reduce((sum, c) => sum + c.length, 0) / clauses.length;
    
    return {
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgClauseLength: Math.round(avgClauseLength * 10) / 10,
      complexity: avgSentenceLength > 20 ? 'high' : avgSentenceLength > 15 ? 'medium' : 'low'
    };
  },

  extractEntities(content) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/g;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    
    return {
      emails: content.match(emailRegex) || [],
      urls: content.match(urlRegex) || [],
      phoneNumbers: content.match(phoneRegex) || [],
      dates: content.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g) || []
    };
  },

  getWordFrequency(content) {
    const words = content.toLowerCase().split(/\W+/);
    const frequency = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b[1] - a[1])
      .slice(0, 20)
      .reduce((obj, [word, count]) => {
        obj[word] = count;
        return obj;
      }, {});
  }
};

// ==================== VALIDATION EXTENSIONS ====================
const ValidationExtensions = {
  // Advanced URL validation
  validateUrlAdvanced(url) {
    const issues = [];
    
    if (!url || typeof url !== 'string') {
      issues.push('URL is required and must be a string');
      return { valid: false, issues };
    }

    try {
      const urlObj = new URL(url);
      
      // Protocol validation
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        issues.push('Invalid protocol - only HTTP and HTTPS allowed');
      }

      // Domain validation
      if (!urlObj.hostname) {
        issues.push('Invalid domain');
      } else if (urlObj.hostname.length > 253) {
        issues.push('Domain name too long');
      }

      // Path validation
      if (urlObj.pathname.length > 2048) {
        issues.push('URL path too long');
      }

      // Query validation
      if (urlObj.search.length > 2048) {
        issues.push('Query string too long');
      }

      return {
        valid: issues.length === 0,
        issues,
        parsed: {
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          port: urlObj.port,
          pathname: urlObj.pathname,
          search: urlObj.search,
          hash: urlObj.hash
        }
      };
    } catch (e) {
      issues.push(`URL parsing error: ${e.message}`);
      return { valid: false, issues };
    }
  },

  // Batch validation
  validateBatch(items, validator) {
    const results = [];
    const errors = [];
    
    items.forEach((item, index) => {
      try {
        const result = validator(item);
        if (result.valid) {
          results.push({ index, item, valid: true, data: result.data || result });
        } else {
          errors.push({ index, item, valid: false, issues: result.issues || [] });
        }
      } catch (e) {
        errors.push({ index, item, valid: false, error: e.message });
      }
    });

    return {
      results,
      errors,
      summary: {
        total: items.length,
        valid: results.length,
        invalid: errors.length
      }
    };
  },

  // Schema validation
  validateAgainstSchema(data, schema) {
    const errors = [];
    const warnings = [];

    const validateField = (field, value, rules) => {
      if (rules.required && (value === null || value === undefined || value === '')) {
        errors.push(`${field} is required`);
      }
      
      if (rules.type && value !== null && value !== undefined) {
        const actualType = typeof value;
        if (actualType !== rules.type) {
          errors.push(`${field} must be ${rules.type}, got ${actualType}`);
        }
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} does not match required pattern`);
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters`);
      }
    };

    // Validate based on schema structure
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([field, rules]) => {
        validateField(field, data[field], rules);
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// ==================== ENCRYPTION EXTENSIONS ====================
const EncryptionExtensions = {
  // Simple XOR encryption
  xorEncrypt(text, key) {
    return text.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ key)
    ).join('');
  },

  xorDecrypt(encryptedText, key) {
    return encryptedText.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ key)
    ).join('');
  },

  // Generate random key
  generateKey(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  },

  // Caesar cipher (for basic obfuscation)
  caesarCipher(text, shift = 3) {
    return text.split('').map(char => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) { // Uppercase letters
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      } else if (code >= 97 && code <= 122) { // Lowercase letters
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      }
      return char;
    }).join('');
  },

  caesarDecipher(text, shift = 3) {
    return this.caesarCipher(text, 26 - shift);
  }
};

// ==================== EXPORT EXTENSIONS ====================
const ExportExtensions = {
  // Export to multiple formats
  exportMultiple(data, formats = ['json', 'csv', 'txt']) {
    const exports = {};
    
    formats.forEach(format => {
      switch (format) {
        case 'json':
          exports.json = JSON.stringify(data, null, 2);
          break;
        case 'csv':
          exports.csv = this.convertToCsv(data);
          break;
        case 'txt':
          exports.txt = this.convertToPlainText(data);
          break;
      }
    });

    return exports;
  },

  convertToCsv(data) {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          `"${String(row[header] || '').replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');
    
    return csv;
  },

  convertToPlainText(data) {
    if (Array.isArray(data)) {
      return data.map(item => JSON.stringify(item, null, 2)).join('\n');
    } else {
      return JSON.stringify(data, null, 2);
    }
  }
};

// ==================== GLOBAL EXPORT ====================
window.HyperSnatchExtensions = {
  Analysis: AnalysisExtensions,
  Validation: ValidationExtensions,
  Encryption: EncryptionExtensions,
  Export: ExportExtensions
};

console.log('HyperSnatch Extensions loaded');
