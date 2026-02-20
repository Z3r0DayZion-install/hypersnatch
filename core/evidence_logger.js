/**
 * Evidence Logger Module
 * Persistent forensic evidence logging for audit trails
 */

const EvidenceLogger = {
  // Module metadata
  name: 'evidence_logger',
  version: '1.0.0',
  description: 'Forensic evidence logging and audit trail management',
  
  // Logger state
  initialized: false,
  sessionId: null,
  logEntries: [],
  maxLogSize: 10000, // Maximum entries in memory
  persistenceEnabled: true,
  logFile: null,
  
  // Log levels
  LOG_LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    SECURITY: 4,
    AUDIT: 5
  },
  
  currentLogLevel: 1, // INFO
  
  /**
   * Initialize evidence logger
   */
  initialize(options = {}) {
    if (this.initialized) return true;
    
    try {
      this.sessionId = this.generateSessionId();
      this.logEntries = [];
      this.persistenceEnabled = options.persistence !== false;
      this.currentLogLevel = options.logLevel || 1;
      this.maxLogSize = options.maxLogSize || 10000;
      
      if (this.persistenceEnabled) {
        this.logFile = options.logFile || `hypersnatch_evidence_${this.sessionId}.log`;
      }
      
      this.initialized = true;
      this.log('INFO', 'Evidence logger initialized', {
        sessionId: this.sessionId,
        persistence: this.persistenceEnabled,
        logLevel: this.currentLogLevel
      });
      
      return true;
    } catch (error) {
      console.error(`[EVIDENCE_LOGGER] Initialization failed: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Add log entry
   */
  log(level, message, metadata = {}) {
    if (!this.initialized) {
      console.warn('[EVIDENCE_LOGGER] Logger not initialized');
      return false;
    }
    
    const levelValue = typeof level === 'string' ? this.LOG_LEVELS[level.toUpperCase()] : level;
    
    if (levelValue < this.currentLogLevel) {
      return false; // Skip if below log threshold
    }
    
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level: typeof level === 'string' ? level.toUpperCase() : this.getLevelName(level),
      message: String(message),
      metadata: this.sanitizeMetadata(metadata),
      sequence: this.logEntries.length + 1
    };
    
    // Add to memory
    this.logEntries.push(entry);
    
    // Maintain memory limit
    if (this.logEntries.length > this.maxLogSize) {
      this.logEntries = this.logEntries.slice(-this.maxLogSize);
    }
    
    // Output to console
    this.outputToConsole(entry);
    
    // Persist if enabled
    if (this.persistenceEnabled) {
      this.persistEntry(entry);
    }
    
    return true;
  },
  
  /**
   * Convenience logging methods
   */
  debug(message, metadata) {
    return this.log('DEBUG', message, metadata);
  },
  
  info(message, metadata) {
    return this.log('INFO', message, metadata);
  },
  
  warning(message, metadata) {
    return this.log('WARNING', message, metadata);
  },
  
  error(message, metadata) {
    return this.log('ERROR', message, metadata);
  },
  
  security(message, metadata) {
    return this.log('SECURITY', message, metadata);
  },
  
  audit(message, metadata) {
    return this.log('AUDIT', message, metadata);
  },
  
  /**
   * Log user action
   */
  logUserAction(action, details = {}) {
    return this.audit(`User action: ${action}`, {
      action,
      userId: details.userId || 'anonymous',
      timestamp: new Date().toISOString(),
      ...details
    });
  },
  
  /**
   * Log system event
   */
  logSystemEvent(event, details = {}) {
    return this.info(`System event: ${event}`, {
      event,
      component: details.component || 'unknown',
      timestamp: new Date().toISOString(),
      ...details
    });
  },
  
  /**
   * Log security event
   */
  logSecurityEvent(event, severity = 'medium', details = {}) {
    return this.security(`Security event: ${event}`, {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...details
    });
  },
  
  /**
   * Log policy violation
   */
  logPolicyViolation(violation, details = {}) {
    return this.security(`Policy violation: ${violation}`, {
      violation,
      severity: 'high',
      timestamp: new Date().toISOString(),
      ...details
    });
  },
  
  /**
   * Log module operation
   */
  logModuleOperation(module, operation, result = 'success', details = {}) {
    return this.info(`Module operation: ${module}.${operation}`, {
      module,
      operation,
      result,
      timestamp: new Date().toISOString(),
      ...details
    });
  },
  
  /**
   * Get log entries
   */
  getEntries(filter = {}) {
    let entries = [...this.logEntries];
    
    // Filter by level
    if (filter.level) {
      const filterLevel = typeof filter.level === 'string' ? 
        this.LOG_LEVELS[filter.level.toUpperCase()] : filter.level;
      entries = entries.filter(entry => {
        const entryLevel = this.LOG_LEVELS[entry.level];
        return entryLevel >= filterLevel;
      });
    }
    
    // Filter by time range
    if (filter.since) {
      const since = new Date(filter.since);
      entries = entries.filter(entry => new Date(entry.timestamp) >= since);
    }
    
    if (filter.until) {
      const until = new Date(filter.until);
      entries = entries.filter(entry => new Date(entry.timestamp) <= until);
    }
    
    // Filter by message content
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      entries = entries.filter(entry => 
        entry.message.toLowerCase().includes(searchTerm) ||
        JSON.stringify(entry.metadata).toLowerCase().includes(searchTerm)
      );
    }
    
    // Limit results
    if (filter.limit) {
      entries = entries.slice(-filter.limit);
    }
    
    return entries;
  },
  
  /**
   * Get log statistics
   */
  getStatistics() {
    const stats = {
      totalEntries: this.logEntries.length,
      sessionId: this.sessionId,
      currentLogLevel: this.currentLogLevel,
      persistenceEnabled: this.persistenceEnabled,
      logFile: this.logFile,
      levelCounts: {},
      timeRange: {
        first: null,
        last: null
      }
    };
    
    // Count by level
    Object.keys(this.LOG_LEVELS).forEach(level => {
      stats.levelCounts[level] = 0;
    });
    
    this.logEntries.forEach(entry => {
      stats.levelCounts[entry.level] = (stats.levelCounts[entry.level] || 0) + 1;
      
      // Track time range
      const timestamp = new Date(entry.timestamp);
      if (!stats.timeRange.first || timestamp < new Date(stats.timeRange.first)) {
        stats.timeRange.first = entry.timestamp;
      }
      if (!stats.timeRange.last || timestamp > new Date(stats.timeRange.last)) {
        stats.timeRange.last = entry.timestamp;
      }
    });
    
    return stats;
  },
  
  /**
   * Export logs
   */
  async exportLogs(format = 'json', filter = {}) {
    const entries = this.getEntries(filter);
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          sessionId: this.sessionId,
          statistics: this.getStatistics(),
          entries
        }, null, 2);
        
      case 'csv':
        return this.exportToCSV(entries);
        
      case 'txt':
        return this.exportToText(entries);
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  },
  
  /**
   * Clear logs
   */
  clearLogs(olderThan = null) {
    if (olderThan) {
      const cutoff = new Date(olderThan);
      const beforeCount = this.logEntries.length;
      this.logEntries = this.logEntries.filter(entry => 
        new Date(entry.timestamp) >= cutoff
      );
      const cleared = beforeCount - this.logEntries.length;
      this.info(`Cleared ${cleared} log entries older than ${olderThan}`);
    } else {
      const count = this.logEntries.length;
      this.logEntries = [];
      this.info(`Cleared all ${count} log entries`);
    }
    
    return true;
  },
  
  /**
   * Set log level
   */
  setLogLevel(level) {
    const levelValue = typeof level === 'string' ? this.LOG_LEVELS[level.toUpperCase()] : level;
    if (levelValue !== undefined) {
      this.currentLogLevel = levelValue;
      this.info(`Log level changed to: ${this.getLevelName(levelValue)}`);
      return true;
    }
    return false;
  },
  
  /**
   * Generate session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `hs_${timestamp}_${random}`;
  },
  
  /**
   * Get level name from value
   */
  getLevelName(levelValue) {
    for (const [name, value] of Object.entries(this.LOG_LEVELS)) {
      if (value === levelValue) {
        return name;
      }
    }
    return 'UNKNOWN';
  },
  
  /**
   * Sanitize metadata for logging
   */
  sanitizeMetadata(metadata) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (value === null || value === undefined) {
        continue;
      }
      
      if (typeof value === 'object') {
        try {
          sanitized[key] = JSON.parse(JSON.stringify(value));
        } catch {
          sanitized[key] = '[Object]';
        }
      } else if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  },
  
  /**
   * Output to console
   */
  outputToConsole(entry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level}] [${entry.sessionId}]`;
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(prefix, entry.message, entry.metadata);
        break;
      case 'INFO':
        console.info(prefix, entry.message, entry.metadata);
        break;
      case 'WARNING':
        console.warn(prefix, entry.message, entry.metadata);
        break;
      case 'ERROR':
      case 'SECURITY':
      case 'AUDIT':
        console.error(prefix, entry.message, entry.metadata);
        break;
      default:
        console.log(prefix, entry.message, entry.metadata);
    }
  },
  
  /**
   * Persist entry to file
   */
  persistEntry(entry) {
    if (!this.logFile) return;
    
    try {
      const logLine = JSON.stringify(entry) + '\n';
      
      if (window.hyper && window.hyper.saveFile) {
        // Append to existing log file
        window.hyper.saveFile(this.logFile, logLine);
      }
    } catch (error) {
      console.error('[EVIDENCE_LOGGER] Failed to persist log entry:', error);
    }
  },
  
  /**
   * Export to CSV format
   */
  exportToCSV(entries) {
    const headers = ['timestamp', 'level', 'message', 'metadata'];
    const rows = entries.map(entry => [
      entry.timestamp,
      entry.level,
      `"${entry.message.replace(/"/g, '""')}"`,
      `"${JSON.stringify(entry.metadata).replace(/"/g, '""')}"`
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  },
  
  /**
   * Export to text format
   */
  exportToText(entries) {
    return entries.map(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const metadataStr = Object.keys(entry.metadata).length > 0 ? 
        ` | ${JSON.stringify(entry.metadata)}` : '';
      return `[${timestamp}] [${entry.level}] ${entry.message}${metadataStr}`;
    }).join('\n');
  }
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  EvidenceLogger.initialize();
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EvidenceLogger;
} else {
  window.EvidenceLogger = EvidenceLogger;
}
