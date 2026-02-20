/**
 * Extension Capture Contract
 * Defines the interface for browser extensions to capture artifacts
 */

const ExtensionCaptureContract = {
  // Contract version
  version: '1.0.0',
  description: 'Extension capture interface for HyperSnatch',
  
  // Contract methods
  contract: {
    /**
     * Capture HTML content from current page
     * @param {Object} options - Capture options
     * @returns {Promise<Object>} Captured HTML data
     */
    captureHTML: async function(options = {}) {
      const defaults = {
        includeStyles: true,
        includeScripts: false,
        includeMetadata: true,
        maxDepth: 10,
        sanitize: false
      };
      
      const config = { ...defaults, ...options };
      
      try {
        // Validate environment
        if (typeof document === 'undefined') {
          throw new Error('Document not available');
        }
        
        // Capture document
        const htmlData = {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          html: null,
          metadata: {}
        };
        
        // Capture HTML content
        if (config.includeStyles) {
          htmlData.html = document.documentElement.outerHTML;
        } else {
          // Clone and remove styles
          const clone = document.documentElement.cloneNode(true);
          const styles = clone.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(style => style.remove());
          htmlData.html = clone.outerHTML;
        }
        
        // Capture metadata
        if (config.includeMetadata) {
          htmlData.metadata = {
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            language: navigator.language,
            cookies: document.cookie,
            localStorage: config.sanitize ? {} : this.getLocalStorageData(),
            sessionStorage: config.sanitize ? {} : this.getSessionStorageData(),
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            documentSize: {
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight
            }
          };
        }
        
        // Add capture metadata
        htmlData.captureMetadata = {
          contractVersion: this.version,
          captureMethod: 'captureHTML',
          config,
          capturedAt: new Date().toISOString()
        };
        
        return htmlData;
        
      } catch (error) {
        throw new Error(`HTML capture failed: ${error.message}`);
      }
    },
    
    /**
     * Capture HAR log from current page
     * @param {Object} options - HAR capture options
     * @returns {Promise<Object>} HAR data
     */
    captureHAR: async function(options = {}) {
      const defaults = {
        includeRequestBody: false,
        includeResponseBody: false,
        maxEntries: 1000,
        filterImages: true,
        filterStylesheets: true
      };
      
      const config = { ...defaults, ...options };
      
      try {
        // Check if DevTools protocol is available
        if (!chrome || !chrome.devtools) {
          throw new Error('HAR capture requires DevTools environment');
        }
        
        // Get HAR from DevTools
        const har = await new Promise((resolve, reject) => {
          chrome.devtools.network.getHAR((harResult) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(harResult);
            }
          });
        });
        
        // Filter and process HAR entries
        let entries = har.log.entries || [];
        
        // Apply filters
        if (config.filterImages) {
          entries = entries.filter(entry => 
            !entry.response.mimeType.includes('image/')
          );
        }
        
        if (config.filterStylesheets) {
          entries = entries.filter(entry => 
            !entry.response.mimeType.includes('text/css')
          );
        }
        
        // Limit entries
        if (config.maxEntries > 0) {
          entries = entries.slice(-config.maxEntries);
        }
        
        // Remove sensitive data if requested
        if (!config.includeRequestBody) {
          entries.forEach(entry => {
            if (entry.request.postData) {
              entry.request.postData.text = '';
            }
          });
        }
        
        if (!config.includeResponseBody) {
          entries.forEach(entry => {
            if (entry.response.content) {
              entry.response.content.text = '';
            }
          });
        }
        
        // Create HAR data structure
        const harData = {
          log: {
            version: har.log.version || '1.2',
            creator: {
              name: 'HyperSnatch Extension',
              version: this.version
            },
            entries: entries,
            pages: har.log.pages || [{
              startedDateTime: new Date().toISOString(),
              id: 'page_1',
              title: document.title,
              pageTimings: {}
            }]
          },
          captureMetadata: {
            contractVersion: this.version,
            captureMethod: 'captureHAR',
            config,
            capturedAt: new Date().toISOString(),
            originalEntryCount: har.log.entries?.length || 0,
            filteredEntryCount: entries.length
          }
        };
        
        return harData;
        
      } catch (error) {
        throw new Error(`HAR capture failed: ${error.message}`);
      }
    },
    
    /**
     * Import artifact to HyperSnatch
     * @param {string} artifactPath - Path to artifact file
     * @param {Object} options - Import options
     * @returns {Promise<Object>} Import result
     */
    importArtifact: async function(artifactPath, options = {}) {
      try {
        // Validate artifact path
        if (!artifactPath || typeof artifactPath !== 'string') {
          throw new Error('Invalid artifact path');
        }
        
        // Check if HyperSnatch bridge is available
        if (!window.hyper || !window.hyper.importArtifact) {
          throw new Error('HyperSnatch bridge not available');
        }
        
        // Import artifact through bridge
        const artifactData = await window.hyper.importArtifact(artifactPath);
        
        // Parse artifact based on type
        let parsedArtifact;
        try {
          if (artifactPath.endsWith('.json')) {
            parsedArtifact = JSON.parse(artifactData);
          } else if (artifactPath.endsWith('.har')) {
            parsedArtifact = JSON.parse(artifactData);
          } else {
            parsedArtifact = {
              type: 'html',
              content: artifactData
            };
          }
        } catch (parseError) {
          parsedArtifact = {
            type: 'text',
            content: artifactData
          };
        }
        
        const result = {
          success: true,
          artifactPath,
          importedAt: new Date().toISOString(),
          parsedArtifact,
          metadata: {
            size: artifactData.length,
            type: parsedArtifact.type,
            contractVersion: this.version
          }
        };
        
        return result;
        
      } catch (error) {
        throw new Error(`Artifact import failed: ${error.message}`);
      }
    },
    
    /**
     * Save artifact to local file
     * @param {Object} artifact - Artifact data
     * @param {string} filename - Filename to save
     * @returns {Promise<Object>} Save result
     */
    saveArtifact: async function(artifact, filename) {
      try {
        // Validate artifact
        if (!artifact || typeof artifact !== 'object') {
          throw new Error('Invalid artifact data');
        }
        
        // Generate filename if not provided
        if (!filename) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          filename = `hypersnatch_artifact_${timestamp}.json`;
        }
        
        // Prepare artifact data
        const artifactData = {
          ...artifact,
          savedAt: new Date().toISOString(),
          contractVersion: this.version
        };
        
        // Save through HyperSnatch bridge
        if (window.hyper && window.hyper.saveFile) {
          const success = await window.hyper.saveFile(filename, JSON.stringify(artifactData, null, 2));
          
          if (!success) {
            throw new Error('Failed to save artifact file');
          }
        } else {
          throw new Error('HyperSnatch bridge not available');
        }
        
        return {
          success: true,
          filename,
          savedAt: new Date().toISOString(),
          size: JSON.stringify(artifactData).length
        };
        
      } catch (error) {
        throw new Error(`Artifact save failed: ${error.message}`);
      }
    },
    
    /**
     * Get local storage data
     */
    getLocalStorageData: function() {
      const data = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          data[key] = localStorage.getItem(key);
        }
      } catch (error) {
        console.warn('Failed to access localStorage:', error);
      }
      return data;
    },
    
    /**
     * Get session storage data
     */
    getSessionStorageData: function() {
      const data = {};
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          data[key] = sessionStorage.getItem(key);
        }
      } catch (error) {
        console.warn('Failed to access sessionStorage:', error);
      }
      return data;
    },
    
    /**
     * Validate capture data
     */
    validateCaptureData: function(data) {
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid data object' };
      }
      
      if (!data.captureMetadata) {
        return { valid: false, error: 'Missing capture metadata' };
      }
      
      if (!data.captureMetadata.contractVersion) {
        return { valid: false, error: 'Missing contract version' };
      }
      
      if (!data.captureMetadata.capturedAt) {
        return { valid: false, error: 'Missing capture timestamp' };
      }
      
      return { valid: true };
    },
    
    /**
     * Get contract information
     */
    getContractInfo: function() {
      return {
        version: this.version,
        description: this.description,
        methods: Object.keys(this).filter(key => typeof this[key] === 'function'),
        capabilities: [
          'html_capture',
          'har_capture',
          'artifact_import',
          'artifact_save',
          'data_validation'
        ],
        requirements: [
          'document object for HTML capture',
          'chrome.devtools for HAR capture',
          'window.hyper bridge for artifact operations'
        ]
      };
    }
  }
};

// Export contract
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExtensionCaptureContract;
} else {
  window.ExtensionCaptureContract = ExtensionCaptureContract;
}
