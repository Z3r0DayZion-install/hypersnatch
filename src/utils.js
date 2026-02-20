// ==================== HYPER SNATCH UTILITIES ====================
// Additional utility functions and extensions

"use strict";

// ==================== ARRAY UTILITIES ====================
const ArrayUtils = {
  // Remove duplicates while preserving order
  unique(array) {
    return [...new Set(array)];
  },

  // Group array by key
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  // Sort array by multiple criteria
  sortBy(array, ...criteria) {
    return array.slice().sort((a, b) => {
      for (const criterion of criteria) {
        const result = criterion(a, b);
        if (result !== 0) return result;
      }
      return 0;
    });
  },

  // Chunk array into smaller arrays
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Find intersection of multiple arrays
  intersect(...arrays) {
    return arrays.reduce((acc, array) => 
      acc.filter(item => array.includes(item))
    );
  },

  // Flatten nested arrays
  flatten(array) {
    return array.reduce((flat, item) => 
      flat.concat(Array.isArray(item) ? this.flatten(item) : item), []
    );
  }
};

// ==================== OBJECT UTILITIES ====================
const ObjectUtils = {
  // Deep clone object
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  // Merge objects deeply
  deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.deepMerge(target, ...sources);
  },

  // Check if value is an object
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  },

  // Pick specific properties from object
  pick(obj, keys) {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },

  // Omit specific properties from object
  omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  },

  // Convert object to query string
  toQueryString(obj) {
    return Object.entries(obj)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }
};

// ==================== DATE UTILITIES ====================
const DateUtils = {
  // Format date relative to now
  formatRelative(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return new Date(date).toLocaleDateString();
    } else if (days > 1) {
      return `${days} days ago`;
    } else if (days === 1) {
      return '1 day ago';
    } else if (hours > 1) {
      return `${hours} hours ago`;
    } else if (hours === 1) {
      return '1 hour ago';
    } else if (minutes > 1) {
      return `${minutes} minutes ago`;
    } else if (minutes === 1) {
      return '1 minute ago';
    } else {
      return 'Just now';
    }
  },

  // Format duration
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ') || '0s';
  },

  // Get start of day
  startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  // Get end of day
  endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
};

// ==================== COLOR UTILITIES ====================
const ColorUtils = {
  // Convert hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Convert RGB to hex
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // Get contrast color (black or white)
  getContrastColor(hexColor) {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return '#000000';
    
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  },

  // Generate color palette
  generatePalette(baseColor, count = 5) {
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return [];

    const palette = [];
    for (let i = 0; i < count; i++) {
      const factor = i / (count - 1);
      const r = Math.round(rgb.r + (255 - rgb.r) * factor);
      const g = Math.round(rgb.g + (255 - rgb.g) * factor);
      const b = Math.round(rgb.b + (255 - rgb.b) * factor);
      palette.push(this.rgbToHex(r, g, b));
    }
    return palette;
  }
};

// ==================== CRYPTO UTILITIES ====================
const CryptoUtils = {
  // Generate simple hash
  async hash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Generate random ID
  generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate UUID v4
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// ==================== MATH UTILITIES ====================
const MathUtils = {
  // Clamp number between min and max
  clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  },

  // Map number from one range to another
  map(value, fromMin, fromMax, toMin, toMax) {
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
  },

  // Linear interpolation
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  },

  // Calculate percentage
  percentage(value, total) {
    return total === 0 ? 0 : (value / total) * 100;
  },

  // Round to decimal places
  round(number, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
  }
};

// ==================== EVENT UTILITIES ====================
const EventUtils = {
  // Create custom event
  createEvent(name, detail = {}) {
    return new CustomEvent(name, { detail, bubbles: true, cancelable: true });
  },

  // Dispatch event with error handling
  safeDispatch(element, eventName, detail = {}) {
    try {
      const event = this.createEvent(eventName, detail);
      return element.dispatchEvent(event);
    } catch (error) {
      console.warn(`Failed to dispatch event ${eventName}:`, error);
      return false;
    }
  },

  // Wait for event
  waitForEvent(element, eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        element.removeEventListener(eventName, handler);
        reject(new Error(`Event ${eventName} timeout`));
      }, timeout);

      const handler = (event) => {
        clearTimeout(timeoutId);
        element.removeEventListener(eventName, handler);
        resolve(event);
      };

      element.addEventListener(eventName, handler);
    });
  }
};

// ==================== DEBUG UTILITIES ====================
const DebugUtils = {
  // Create debug logger
  createLogger(prefix = 'HyperSnatch') {
    return {
      log: (...args) => console.log(`[${prefix}]`, ...args),
      warn: (...args) => console.warn(`[${prefix}]`, ...args),
      error: (...args) => console.error(`[${prefix}]`, ...args),
      debug: (...args) => console.debug(`[${prefix}]`, ...args)
    };
  },

  // Measure function performance
  measure(fn, name = 'Function') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Trace function calls
  trace(fn, name = 'Function') {
    return function(...args) {
      console.log(`${name} called with:`, args);
      const result = fn.apply(this, args);
      console.log(`${name} returned:`, result);
      return result;
    };
  }
};

// ==================== GLOBAL EXPORT ====================
window.HyperSnatchUtils = {
  Array: ArrayUtils,
  Object: ObjectUtils,
  Date: DateUtils,
  Color: ColorUtils,
  Crypto: CryptoUtils,
  Math: MathUtils,
  Event: EventUtils,
  Debug: DebugUtils
};

console.log('HyperSnatch Utilities loaded');
