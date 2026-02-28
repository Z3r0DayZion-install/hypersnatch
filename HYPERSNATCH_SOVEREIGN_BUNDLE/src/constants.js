// ==================== HYPER SNATCH CONSTANTS ====================
// Application constants and configuration

"use strict";

// ==================== VERSION INFO ====================
export const VERSION = '1.0.0-rc.1';
export const ENGINE_VERSION = '14.0.0';
export const POLICY_VERSION = '2.1.0';
export const BUILD_ID = 'release_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// ==================== APPLICATION CONFIG ====================
export const APP_CONFIG = {
  NAME: 'HyperSnatch',
  DESCRIPTION: 'Security-First Evidence Analyzer',
  AUTHOR: 'HyperSnatch Security Team',
  HOMEPAGE: 'https://hypersnatch.com',
  REPOSITORY: 'https://github.com/hypersnatch-security/hypersnatch'
};

// ==================== POLICY CONFIG ====================
export const POLICY_CONFIG = {
  // Engine modes
  ENGINE_MODES: {
    STRICT: 'strict',
    MODERATE: 'moderate',
    PERMISSIVE: 'permissive'
  },

  // Refusal reasons
  REFUSAL_REASONS: {
    PREMIUM_MARKERS: 'Premium content markers detected',
    PAYWALL_MARKERS: 'Paywall markers detected',
    DRM_MARKERS: 'DRM protection markers detected',
    LOGIN_REQUIRED: 'Login required markers detected',
    RESTRICTED_CONTENT: 'Restricted content markers detected',
    SUSPICIOUS_PATTERN: 'Suspicious content patterns detected',
    POLICY_VIOLATION: 'Policy violation detected',
    INVALID_SOURCE: 'Invalid source type detected'
  },

  // Content markers to check
  PREMIUM_MARKERS: [
    'premium', 'vip', 'gold', 'platinum', 'pro', 'plus',
    'subscription', 'membership', 'paid', 'upgrade',
    'unlock', 'purchase', 'buy now', 'checkout'
  ],

  PAYWALL_MARKERS: [
    'paywall', 'subscribe', 'sign in', 'login required',
    'create account', 'register', 'join now', 'get access',
    'limited access', 'restricted', 'members only'
  ],

  DRM_MARKERS: [
    'drm', 'digital rights', 'copy protection',
    'license required', 'activation required', 'authentication'
  ],

  SUSPICIOUS_PATTERNS: [
    'javascript:', 'data:text/html', 'vbscript:',
    'onload=', 'onerror=', 'eval(', 'document.write'
  ]
};

// ==================== UI CONFIG ====================
export const UI_CONFIG = {
  // Display limits
  MAX_CANDIDATES_DISPLAY: 20,
  MAX_REFUSALS_DISPLAY: 10,
  MAX_EVIDENCE_DISPLAY: 50,
  MAX_LOG_ENTRIES: 50,

  // Confidence thresholds
  CONFIDENCE_THRESHOLDS: {
    HIGH: 80,
    MEDIUM: 50,
    LOW: 0
  },

  // Status colors
  STATUS_COLORS: {
    VALIDATED: '#13d0a6',
    PENDING: '#ffbf47',
    FAILED: '#ff6b6b',
    UNKNOWN: '#8ea0b1'
  },

  // Animation durations
  ANIMATION_DURATION: 450,
  DEBOUNCE_DELAY: 300,

  // File size limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TEXT_LENGTH: 1000000, // 1M characters
};

// ==================== STORAGE CONFIG ====================
export const STORAGE_CONFIG = {
  // Storage keys
  KEYS: {
    STATE: 'hs.state.v2',
    SETTINGS: 'hs.settings',
    EVIDENCE: 'hs.evidence',
    CACHE: 'hs.cache'
  },

  // Storage limits
  MAX_STATE_SIZE: 1024 * 1024, // 1MB
  MAX_CACHE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_EVIDENCE_ENTRIES: 1000,

  // Cleanup intervals
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ==================== NETWORK CONFIG ====================
export const NETWORK_CONFIG = {
  // Request timeouts
  TIMEOUTS: {
    DEFAULT: 5000,
    LONG: 10000,
    SHORT: 2000
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
    BACKOFF_FACTOR: 2
  },

  // User agent
  USER_AGENT: 'HyperSnatch/1.0.0-rc.1 (Evidence Analyzer)',

  // Allowed protocols
  ALLOWED_PROTOCOLS: ['http:', 'https:'],

  // Blocked domains
  BLOCKED_DOMAINS: [
    'ads.',
    'tracking.',
    'analytics.',
    'doubleclick.',
    'googleads.'
  ]
};

// ==================== VALIDATION CONFIG ====================
export const VALIDATION_CONFIG = {
  // URL patterns
  URL_PATTERNS: {
    HTTP: /^https?:\/\/.+/,
    DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  // File types
  ALLOWED_FILE_TYPES: [
    '.html', '.htm', '.txt', '.json', '.har',
    '.xml', '.csv', '.log', '.md'
  ],

  // Content types
  ALLOWED_CONTENT_TYPES: [
    'text/html',
    'text/plain',
    'text/xml',
    'application/json',
    'application/xml',
    'text/csv'
  ],

  // Size limits
  MAX_URL_LENGTH: 2048,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 500
};

// ==================== EXPORT CONFIG ====================
export const EXPORT_CONFIG = {
  // Export formats
  FORMATS: {
    JSON: 'json',
    CSV: 'csv',
    TXT: 'txt',
    HTML: 'html'
  },

  // Default filenames
  DEFAULT_FILENAMES: {
    EVIDENCE: 'hypersnatch-evidence',
    CANDIDATES: 'hypersnatch-candidates',
    REFUSALS: 'hypersnatch-refusals',
    REPORT: 'hypersnatch-report'
  },

  // Export options
  OPTIONS: {
    INCLUDE_METADATA: true,
    INCLUDE_TIMESTAMPS: true,
    INCLUDE_CONFIDENCE: true,
    INCLUDE_VALIDATION: true
  }
};

// ==================== SECURITY CONFIG ====================
export const SECURITY_CONFIG = {
  // CSP (Content Security Policy)
  CSP_DIRECTIVES: {
    "default-src": "'self'",
    "script-src": "'self' 'unsafe-inline'",
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' data:",
    "connect-src": "'self'",
    "font-src": "'self'",
    "object-src": "'none'",
    "media-src": "'self'",
    "frame-src": "'none'"
  },

  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  },

  // Allowed origins for CORS
  ALLOWED_ORIGINS: [
    'http://localhost:*',
    'https://hypersnatch.com'
  ]
};

// ==================== ERROR MESSAGES ====================
export const ERROR_MESSAGES = {
  // General errors
  GENERIC: 'An unexpected error occurred',
  NETWORK: 'Network connection failed',
  TIMEOUT: 'Request timed out',
  PARSE: 'Failed to parse response',

  // File errors
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_READ_ERROR: 'Failed to read file',

  // Validation errors
  INVALID_URL: 'Invalid URL format',
  INVALID_EMAIL: 'Invalid email format',
  MISSING_REQUIRED: 'Required field is missing',

  // Policy errors
  CONTENT_BLOCKED: 'Content blocked by policy',
  PREMIUM_CONTENT: 'Premium content detected',
  PAYWALL_CONTENT: 'Paywall content detected',

  // Storage errors
  STORAGE_QUOTA: 'Storage quota exceeded',
  STORAGE_ERROR: 'Storage operation failed'
};

// ==================== SUCCESS MESSAGES ====================
export const SUCCESS_MESSAGES = {
  // General success
  OPERATION_COMPLETE: 'Operation completed successfully',
  DATA_SAVED: 'Data saved successfully',
  DATA_LOADED: 'Data loaded successfully',

  // Processing success
  ANALYSIS_COMPLETE: 'Analysis completed successfully',
  VALIDATION_COMPLETE: 'Validation completed successfully',
  EXPORT_COMPLETE: 'Export completed successfully',

  // File operations
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DOWNLOADED: 'File downloaded successfully',
  FILE_IMPORTED: 'File imported successfully'
};

// ==================== REGEX PATTERNS ====================
export const REGEX_PATTERNS = {
  // URL patterns
  URL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Content patterns
  PHONE: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,
  DATE: /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/,
  TIME: /\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)?/,

  // Code patterns
  JAVASCRIPT: /<script[^>]*>[\s\S]*?<\/script>/gi,
  CSS: /<style[^>]*>[\s\S]*?<\/style>/gi,
  HTML_TAG: /<[^>]+>/g,

  // Text patterns
  WHITESPACE: /\s+/g,
  SPECIAL_CHARS: /[^\w\s-]/g,
  NUMBERS: /\d+/g
};

// ==================== KEYBOARD SHORTCUTS ====================
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  TAB_NEXT: 'Tab',
  TAB_PREV: 'Shift+Tab',
  ESCAPE: 'Escape',

  // Actions
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  CUT: 'Ctrl+X',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',

  // Application specific
  ANALYZE: 'Ctrl+Enter',
  CLEAR: 'Ctrl+Delete',
  EXPORT: 'Ctrl+E',
  IMPORT: 'Ctrl+I',
  SEARCH: 'Ctrl+F',
  HELP: 'F1'
};

// ==================== DEBUG FLAGS ====================
export const DEBUG_FLAGS = {
  ENABLE_LOGGING: false,
  ENABLE_PERFORMANCE_MONITORING: false,
  ENABLE_NETWORK_LOGGING: false,
  ENABLE_ERROR_STACK_TRACES: true,
  ENABLE_CONSOLE_OUTPUT: true
};

// ==================== ENVIRONMENT DETECTION ====================
export const ENVIRONMENT = {
  isDevelopment: () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  isProduction: () => !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'),
  isElectron: () => typeof window !== 'undefined' && window.process && window.process.type,
  isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  isDesktop: () => !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
};

// ==================== GLOBAL EXPORT ====================
window.HyperSnatchConstants = {
  VERSION,
  ENGINE_VERSION,
  POLICY_VERSION,
  BUILD_ID,
  APP_CONFIG,
  POLICY_CONFIG,
  UI_CONFIG,
  STORAGE_CONFIG,
  NETWORK_CONFIG,
  VALIDATION_CONFIG,
  EXPORT_CONFIG,
  SECURITY_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX_PATTERNS,
  KEYBOARD_SHORTCUTS,
  DEBUG_FLAGS,
  ENVIRONMENT
};

console.log('HyperSnatch Constants loaded');
