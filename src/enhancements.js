// ==================== HYPER SNATCH ENHANCEMENTS ====================
// Advanced features and enhancements for the Link Resurrection Engine

"use strict";

// ==================== PERFORMANCE OPTIMIZATIONS ====================
const PerformanceOptimizations = {
  // Lazy loading for large datasets
  createLazyLoader(loadFn, options = {}) {
    let loaded = false;
    let data = null;
    let cache = new Map();
    
    return {
      load: async (key) => {
        if (cache.has(key)) {
          return cache.get(key);
        }
        
        if (!loaded) {
          loaded = true;
          data = await loadFn();
          
          // Cache the result
          if (options.cacheSize && cache.size >= options.cacheSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          cache.set(key, data);
          loaded = false;
        }
        
        return data;
      },
      
      preload: async (keys) => {
        const promises = keys.map(key => this.load(key));
        return Promise.all(promises);
      },
      
      clearCache: () => {
        cache.clear();
      },
      
      getCacheSize: () => cache.size,
      getCacheKeys: () => Array.from(cache.keys())
    };
  },

  // Virtual scrolling for large lists
  createVirtualScroll(container, options = {}) {
    const itemHeight = options.itemHeight || 40;
    const visibleItems = Math.ceil(container.clientHeight / itemHeight);
    const scrollTop = container.scrollTop;
    const startIndex = Math.floor(scrollTop / itemHeight);
    
    return {
      visibleStart: startIndex,
      visibleEnd: Math.min(startIndex + visibleItems, options.totalItems || 0),
      visibleCount: visibleItems,
      scrollTo: (index) => {
        container.scrollTop = index * itemHeight;
      },
      updateVisibleRange: () => {
        const newScrollTop = container.scrollTop;
        const newStartIndex = Math.floor(newScrollTop / itemHeight);
        const newEndIndex = Math.min(newStartIndex + visibleItems, options.totalItems || 0);
        
        return {
          start: newStartIndex,
          end: newEndIndex,
          count: newEndIndex - newStartIndex
        };
      }
    };
  },

  // Debounced resize handler
  createResizeHandler(callback, delay = 250) {
    let timeoutId;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback();
      }, delay);
    };
  }
};

// ==================== DATA PROCESSING ====================
const DataProcessing = {
  // Batch processing for large datasets
  createBatchProcessor(options = {}) {
    const batchSize = options.batchSize || 100;
    const delay = options.delay || 10;
    
    return {
      process: async (items, processor) => {
        const results = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(item => processor(item))
          );
          
          results.push(...batchResults);
          
          // Add delay between batches
          if (i + batchSize < items.length && delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        return results;
      },
      
      processWithProgress: async (items, processor, onProgress) => {
        const results = [];
        const total = items.length;
        
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(item => processor(item))
          );
          
          results.push(...batchResults);
          
          // Report progress
          if (onProgress) {
            onProgress({
              processed: Math.min(i + batchSize, total),
              total,
              percentage: Math.round((Math.min(i + batchSize, total) / total) * 100)
            });
          }
          
          if (i + batchSize < items.length && delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        return results;
      }
    };
  },

  // Data transformation utilities
  transform: {
    // Flatten nested objects
    flatten: (obj, prefix = '', separator = '.') => {
      const result = {};
      
      const flatten = (current, key, value) => {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.keys(value).forEach(nestedKey => {
            flatten(current, nestedKey, value[nestedKey]);
          });
        } else {
          result[newKey] = value;
        }
      };
      
      flatten(obj);
      return result;
    },

    // Group by key
    groupBy: (array, key) => {
      return array.reduce((groups, item) => {
        const group = item[key];
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(item);
        return groups;
      }, {});
    },

    // Sort by multiple criteria
    multiSort: (array, comparators) => {
      return array.slice().sort((a, b) => {
        for (const comparator of comparators) {
          const result = comparator(a, b);
          if (result !== 0) return result;
        }
        return 0;
      });
    }
  }
};

// ==================== CACHE MANAGEMENT ====================
const CacheManagement = {
  // LRU cache implementation
  createLRUCache(maxSize = 100) {
    const cache = new Map();
    const accessOrder = [];
    
    return {
      get: (key) => {
        if (cache.has(key)) {
          // Move to end of access order
          const index = accessOrder.indexOf(key);
          if (index > -1) {
            accessOrder.splice(index, 1);
            accessOrder.push(key);
          }
          return cache.get(key);
        }
        return null;
      },
      
      set: (key, value) => {
        if (cache.has(key)) {
          // Update existing
          cache.set(key, value);
        } else {
          // Add new
          cache.set(key, value);
          accessOrder.push(key);
        }
        
        // Remove oldest if over capacity
        while (cache.size > maxSize) {
          const oldestKey = accessOrder.shift();
          cache.delete(oldestKey);
        }
      },
      
      has: (key) => cache.has(key),
      
      delete: (key) => {
        cache.delete(key);
        const index = accessOrder.indexOf(key);
        if (index > -1) {
          accessOrder.splice(index, 1);
        }
      },
      
      clear: () => {
        cache.clear();
        accessOrder.length = 0;
      },
      
      size: () => cache.size,
      
      keys: () => Array.from(cache.keys()),
      
      values: () => Array.from(cache.values())
    };
  },

  // IndexedDB wrapper
  createIndexedDBCache(dbName, storeName, version = 1) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const store = db.objectStoreNames.contains(storeName) 
          ? db.transaction([storeName], 'readwrite').objectStore(storeName)
          : db.createObjectStore(storeName, { keyPath: 'id' });
        
        resolve({
          db,
          store,
          get: (key) => new Promise((res, rej) => {
            const request = store.get(key);
            request.onsuccess = () => res(request.result);
            request.onerror = () => rej(request.error);
          }),
          
          create: (key, value) => new Promise((res, rej) => {
            const request = store.put({ id: key, value });
            request.onsuccess = () => res();
            request.onerror = () => rej(request.error);
          }),
          
          delete: (key) => new Promise((res, rej) => {
            const request = store.delete(key);
            request.onsuccess = () => res();
            request.onerror = () => rej(request.error);
          }),
          
          clear: () => new Promise((res, rej) => {
            const request = store.clear();
            request.onsuccess = () => res();
            request.onerror = () => rej(request.error);
          })
        });
      };
    });
  }
};

// ==================== NOTIFICATION SYSTEM ====================
const NotificationSystem = {
  // Create notification manager
  createManager: (options = {}) => {
    const notifications = [];
    const maxNotifications = options.maxNotifications || 5;
    
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    
    document.body.appendChild(container);
    
    return {
      show: (message, type = 'info', duration = 5000) => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
          <div class="notification-content">${message}</div>
          <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(notification);
        notifications.push(notification);
        
        // Auto-remove
        setTimeout(() => {
          notification.remove();
          const index = notifications.indexOf(notification);
          if (index > -1) notifications.splice(index, 1);
        }, duration);
        
        // Limit notifications
        while (notifications.length > maxNotifications) {
          const oldest = notifications.shift();
          if (oldest && oldest.parentElement) {
            oldest.remove();
          }
        }
      },
      
      clear: () => {
        notifications.forEach(notification => {
          if (notification.parentElement) {
            notification.remove();
          }
        });
        notifications.length = 0;
      },
      
      getCount: () => notifications.length
    };
  }
};

// ==================== GLOBAL EXPORT ====================
window.HyperSnatchEnhancements = {
  Performance: PerformanceOptimizations,
  DataProcessing: DataProcessing,
  CacheManagement: CacheManagement,
  NotificationSystem: NotificationSystem
};

console.log('HyperSnatch Enhancements loaded');
