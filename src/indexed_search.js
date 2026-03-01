// ==================== INDEXED SEARCH ACROSS VAULT ====================
"use strict";

// Only require migrations if not in a browser/sandboxed environment
let Migrations;
try {
  Migrations = require('./migrations');
} catch (e) {
  // Fallback for browser if needed, or assume latest
  Migrations = { latestVersion: 3 };
}

const IndexedSearch = {
  dbName: 'HyperSnatchVault',
  version: Migrations.latestVersion,
  db: null,

  // Index schema
  schema: {
    stores: {
      jobs: {
        keyPath: 'id',
        indexes: {
          batchId: 'batchId',
          createdAt: 'createdAt',
          status: 'status',
          host: 'host',
          label: 'label',
          tags: 'tags',
          hsxCode: 'hsxCode'
        }
      },
      snapshots: {
        keyPath: 'id',
        indexes: {
          jobId: 'jobId',
          createdAt: 'createdAt',
          type: 'type',
          url: 'url',
          filename: 'filename',
          confidence: 'confidence'
        }
      },
      searchIndex: {
        keyPath: 'id',
        indexes: {
          term: 'term',
          itemType: 'itemType',
          count: 'count',
          lastIndexed: 'lastIndexed'
        }
      }
    }
  },

  async init() {
    // If bridge is available, use it
    if (typeof window !== 'undefined' && window.vaultSearch && window.vaultSearch.init) {
      return window.vaultSearch.init();
    }

    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB not available'));
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const transaction = event.target.transaction;

        // Create baseline stores if they don't exist
        Object.entries(this.schema.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: config.keyPath });

            // Create indexes
            Object.entries(config.indexes).forEach(([indexName, keyPath]) => {
              store.createIndex(indexName, keyPath, { multiEntry: Array.isArray(keyPath) });
            });
          }
        });

        // Run migrations for subsequent versions
        if (Migrations.migrate) {
          Migrations.migrate(db, transaction, oldVersion);
        }
      };
    });
  },

  async indexJob(job) {
    if (typeof window !== 'undefined' && window.vaultSearch && window.vaultSearch.indexJob) {
      return window.vaultSearch.indexJob(job);
    }

    if (!this.db) await this.init();

    const transaction = this.db.transaction(['jobs'], 'readwrite');
    const store = transaction.objectStore('jobs');

    // Add search terms
    const searchTerms = this.extractSearchTerms(job);

    const jobRecord = {
      ...job,
      indexedAt: new Date().toISOString(),
      searchTerms
    };

    return new Promise((resolve, reject) => {
      const request = store.put(jobRecord);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async indexSnapshot(snapshot) {
    if (typeof window !== 'undefined' && window.vaultSearch && window.vaultSearch.indexSnapshot) {
      return window.vaultSearch.indexSnapshot(snapshot);
    }

    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['snapshots', 'searchIndex'], 'readwrite');
      const snapshotStore = transaction.objectStore('snapshots');
      const searchStore = transaction.objectStore('searchIndex');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      // Index snapshot
      snapshotStore.put({
        ...snapshot,
        indexedAt: new Date().toISOString()
      });

      // Batch index search terms
      const searchTerms = this.extractSearchTerms(snapshot);
      searchTerms.forEach(term => {
        const termRequest = searchStore.get(term);
        termRequest.onsuccess = () => {
          const existing = termRequest.result || {
            id: term,
            term,
            itemType: snapshot.type || 'unknown',
            count: 0,
            lastIndexed: null,
            itemIds: [] // Track which items match this term
          };

          existing.count++;
          existing.lastIndexed = new Date().toISOString();
          if (!existing.itemIds) existing.itemIds = [];
          if (!existing.itemIds.includes(snapshot.id)) {
            existing.itemIds.push(snapshot.id);
          }

          searchStore.put(existing);
        };
      });
    });
  },

  extractSearchTerms(item) {
    const terms = new Set();

    // Add basic fields
    if (item.id) terms.add(item.id);
    if (item.batchId) terms.add(item.batchId);
    if (item.status) terms.add(item.status);
    if (item.type) terms.add(item.type);
    if (item.hsxCode) terms.add(item.hsxCode);

    // Add URL components
    if (item.url) {
      try {
        const url = new URL(item.url);
        terms.add(url.hostname);
        terms.add(url.pathname);
        if (url.search) {
          url.searchParams.forEach((value, key) => {
            terms.add(key);
            terms.add(value);
          });
        }
      } catch (e) {
        // Add as raw string if invalid URL
        terms.add(item.url);
      }
    }

    // Add filename components
    if (item.filename) {
      const filename = item.filename;
      terms.add(filename);
      terms.add(filename.split('.')[0]); // Without extension
      terms.add(filename.split('.').pop()); // Extension only
    }

    // Add tags
    if (Array.isArray(item.tags)) {
      item.tags.forEach(tag => terms.add(tag));
    }

    // Add content terms (truncated)
    if (item.content && typeof item.content === 'string') {
      const content = item.content.substring(0, 1000); // Limit content indexing
      const words = content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 2) terms.add(cleanWord);
      });
    }

    // Add metadata terms
    if (item.metadata && typeof item.metadata === 'object') {
      Object.values(item.metadata).forEach(value => {
        if (typeof value === 'string') {
          terms.add(value);
        }
      });
    }

    return Array.from(terms);
  },

  async search(query, options = {}) {
    if (typeof window !== 'undefined' && window.vaultSearch && window.vaultSearch.search) {
      return window.vaultSearch.search({ query, options });
    }

    if (!this.db) await this.init();

    const {
      itemType,
      status,
      host,
      dateRange,
      hsxCode,
      limit = 50,
      offset = 0
    } = options;

    const transaction = this.db.transaction(['jobs', 'snapshots', 'searchIndex'], 'readonly');
    const jobStore = transaction.objectStore('jobs');
    const snapshotStore = transaction.objectStore('snapshots');
    const searchStore = transaction.objectStore('searchIndex');

    const results = {
      jobs: [],
      snapshots: [],
      total: 0,
      query,
      options
    };

    // Search by term
    if (query) {
      const searchTerm = query.toLowerCase();

      // Search in searchIndex
      const searchResults = await this.searchByTerm(searchStore, searchTerm);

      // Get full records
      for (const searchResult of searchResults) {
        // Find related snapshots
        const snapshotResults = await this.searchSnapshotsByTerm(snapshotStore, searchTerm, searchStore);
        results.snapshots.push(...snapshotResults);
      }
    }

    // Apply filters
    if (status || host || hsxCode || dateRange) {
      results.jobs = await this.searchJobsWithFilters(jobStore, options);
      results.snapshots = await this.searchSnapshotsWithFilters(snapshotStore, options);
    }

    // Apply pagination
    results.total = results.jobs.length + results.snapshots.length;
    results.jobs = results.jobs.slice(offset, offset + limit);
    results.snapshots = results.snapshots.slice(offset, offset + limit);

    return results;
  },

  async searchByTerm(store, term) {
    return new Promise((resolve, reject) => {
      const index = store.index('term');
      const request = index.getAll(term);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = reject;
    });
  },

  async searchSnapshotsByTerm(store, term, searchStore) {
    // Optimization: Use searchIndex to find relevant IDs first
    // instead of a full cursor-based scan of the snapshots store.
    const termResult = await this.searchByTerm(searchStore, term);
    const itemIds = termResult.flatMap(r => r.itemIds || []);

    if (itemIds.length === 0) return [];

    // Get unique records by ID
    const uniqueIds = Array.from(new Set(itemIds)).slice(0, 100); // Guard limit
    const records = await Promise.all(uniqueIds.map(id => {
      return new Promise((resolve) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    }));

    return records.filter(Boolean);
  },

  async searchJobsWithFilters(store, options) {
    return new Promise((resolve, reject) => {
      let request;

      if (options.status) {
        const index = store.index('status');
        request = index.getAll(options.status);
      } else if (options.host) {
        const index = store.index('host');
        request = index.getAll(options.host);
      } else if (options.hsxCode) {
        const index = store.index('hsxCode');
        request = index.getAll(options.hsxCode);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result || [];

        // Apply date range filter
        if (options.dateRange) {
          const { start, end } = options.dateRange;
          results = results.filter(item => {
            const createdAt = new Date(item.createdAt);
            return createdAt >= new Date(start) && createdAt <= new Date(end);
          });
        }

        resolve(results);
      };

      request.onerror = reject;
    });
  },

  async searchSnapshotsWithFilters(store, options) {
    return new Promise((resolve, reject) => {
      let request;

      if (options.itemType) {
        const index = store.index('type');
        request = index.getAll(options.itemType);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result || [];

        // Apply filters
        if (options.confidence !== undefined) {
          results = results.filter(item => item.confidence >= options.confidence);
        }

        if (options.dateRange) {
          const { start, end } = options.dateRange;
          results = results.filter(item => {
            const createdAt = new Date(item.createdAt);
            return createdAt >= new Date(start) && createdAt <= new Date(end);
          });
        }

        resolve(results);
      };

      request.onerror = reject;
    });
  },

  async getStats() {
    if (typeof window !== 'undefined' && window.vaultSearch && window.vaultSearch.getStats) {
      return window.vaultSearch.getStats();
    }

    if (!this.db) await this.init();

    const transaction = this.db.transaction(['jobs', 'snapshots'], 'readonly');
    const jobStore = transaction.objectStore('jobs');
    const snapshotStore = transaction.objectStore('snapshots');

    const [jobCount, snapshotCount] = await Promise.all([
      this.countStore(jobStore),
      this.countStore(snapshotStore)
    ]);

    return {
      totalJobs: jobCount,
      totalSnapshots: snapshotCount,
      totalItems: jobCount + snapshotCount
    };
  },

  async countStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  },

  async clear() {
    if (typeof window !== 'undefined' && window.vaultSearch && window.vaultSearch.clear) {
      return window.vaultSearch.clear();
    }

    if (!this.db) await this.init();

    const transaction = this.db.transaction(['jobs', 'snapshots', 'searchIndex'], 'readwrite');

    return Promise.all([
      this.clearStore(transaction.objectStore('jobs')),
      this.clearStore(transaction.objectStore('snapshots')),
      this.clearStore(transaction.objectStore('searchIndex'))
    ]);
  },

  async clearStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  }
};

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.IndexedSearch = IndexedSearch;
}

module.exports = IndexedSearch;
