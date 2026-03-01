// ==================== CRASH-REPAIR JOURNAL REPLAY ====================
"use strict";

const CrashJournal = {
  dbName: 'HyperSnatchJournal',
  version: 1,
  db: null,
  journal: [],
  maxEntries: 1000,

  // Journal event types
  EventType: {
    INGEST_START: 'ingest_start',
    INGEST_END: 'ingest_end',
    DECODE_START: 'decode_start',
    DECODE_END: 'decode_end',
    IMPORT_START: 'import_start',
    IMPORT_END: 'import_end',
    EXPORT_START: 'export_start',
    EXPORT_END: 'export_end',
    TRUST_CHANGE: 'trust_change',
    VAULT_SAVE: 'vault_save',
    APP_START: 'app_start',
    APP_SHUTDOWN: 'app_shutdown',
    ERROR: 'error'
  },

  async init() {
    // If bridge is available, use it
    if (typeof window !== 'undefined' && window.crashJournal && window.crashJournal.getStats) {
      // In bridge mode, EventType might need sync
      const remoteTypes = await window.crashJournal.getEventType();
      if (remoteTypes) this.EventType = remoteTypes;
      return true;
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

        // Create journal store
        if (!db.objectStoreNames.contains('journal')) {
          const store = db.createObjectStore('journal', { keyPath: 'timestamp' });

          // Create indexes
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('jobId', 'jobId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  },

  async logEvent(type, data = {}, status = 'running') {
    if (typeof window !== 'undefined' && window.crashJournal && window.crashJournal.logEvent) {
      return window.crashJournal.logEvent(type, data, status);
    }

    if (!this.db) await this.init();

    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type,
      status,
      data,
      sessionId: this.getSessionId()
    };

    // Add to in-memory journal
    this.journal.push(event);

    // Trim in-memory journal
    if (this.journal.length > this.maxEntries) {
      this.journal = this.journal.slice(-this.maxEntries);
    }

    // Persist to IndexedDB
    const transaction = this.db.transaction(['journal'], 'readwrite');
    const store = transaction.objectStore('journal');

    return new Promise((resolve, reject) => {
      const request = store.put(event);
      request.onsuccess = () => resolve(event);
      request.onerror = () => reject(request.error);
    });
  },

  async getEvents(type = null, limit = 100) {
    // Note: getEvents not currently in bridge, using local or needing extension
    if (!this.db) await this.init();
    if (!this.db) return []; // Bridge doesn't support getEvents directly yet

    const transaction = this.db.transaction(['journal'], 'readonly');
    const store = transaction.objectStore('journal');

    return new Promise((resolve, reject) => {
      let request;

      if (type) {
        const index = store.index('type');
        request = index.getAll(type, limit);
      } else {
        request = store.getAll(null, limit);
      }

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async getIncompleteOperations() {
    if (!this.db) await this.init();
    if (!this.db) return {};

    const transaction = this.db.transaction(['journal'], 'readonly');
    const store = transaction.objectStore('journal');
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll('running');
      request.onsuccess = () => {
        const events = request.result || [];

        // Group by type and find incomplete operations
        const incomplete = {};

        events.forEach(event => {
          const type = event.type;

          if (!incomplete[type]) {
            incomplete[type] = [];
          }

          incomplete[type].push(event);
        });

        resolve(incomplete);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async detectUncleanShutdown() {
    if (typeof window !== 'undefined' && window.crashJournal && window.crashJournal.detectUncleanShutdown) {
      return window.crashJournal.detectUncleanShutdown();
    }

    const events = await this.getEvents();

    // Look for app_shutdown without proper completion
    const appStartEvents = events.filter(e => e.type === this.EventType.APP_START);
    const appShutdownEvents = events.filter(e => e.type === this.EventType.APP_SHUTDOWN);
    const incompleteOps = await this.getIncompleteOperations();

    const hasIncompleteOps = Object.keys(incompleteOps).length > 0;
    const hasUncleanShutdown = appStartEvents.length > appShutdownEvents.length;

    return {
      hasUncleanShutdown,
      incompleteOperations: incompleteOps,
      lastSession: appStartEvents[appStartEvents.length - 1],
      needsRepair: hasUncleanShutdown || hasIncompleteOps
    };
  },

  async replayJournal() {
    if (typeof window !== 'undefined' && window.crashJournal && window.crashJournal.replayJournal) {
      return window.crashJournal.replayJournal();
    }

    const incompleteOps = await this.getIncompleteOperations();
    const replayResults = [];

    for (const [type, events] of Object.entries(incompleteOps)) {
      for (const event of events) {
        try {
          const result = await this.replayEvent(event);
          replayResults.push({
            eventId: event.id,
            type,
            replayed: true,
            result,
            error: null
          });
        } catch (error) {
          replayResults.push({
            eventId: event.id,
            type,
            replayed: false,
            result: null,
            error: error.message
          });
        }
      }
    }

    // Clear incomplete operations after successful replay
    if (replayResults.every(r => r.replayed)) {
      await this.clearIncompleteOperations();
    }

    return replayResults;
  },

  async replayEvent(event) {
    const { type, data } = event;

    switch (type) {
      case this.EventType.INGEST_START:
        if (data.queueData) return this.resumeIngest(data.queueData);
        break;

      case this.EventType.DECODE_START:
        if (data.jobData) return this.resumeDecode(data.jobData);
        break;

      case this.EventType.IMPORT_START:
        if (data.importData) return this.resumeImport(data.importData);
        break;

      case this.EventType.EXPORT_START:
        if (data.exportData) return this.resumeExport(data.exportData);
        break;

      case this.EventType.TRUST_CHANGE:
        // Re-verify trust state if needed
        return { reloaded: true };

      default:
        console.warn(`No replay logic for event type: ${type}`);
        return { skipped: true };
    }
  },

  async resumeIngest(queueData) {
    // Re-queue the data and restart processing
    if (window.SmartQueue && queueData) {
      window.SmartQueue.enqueue(queueData.text, queueData.source);
      await window.SmartQueue.process();

      await this.logEvent(this.EventType.INGEST_END, {
        resumed: true,
        itemsProcessed: queueData.items?.length || 0
      }, 'completed');

      return { success: true, itemsProcessed: queueData.items?.length || 0 };
    }

    throw new Error('SmartQueue not available');
  },

  async resumeDecode(jobData) {
    // Resume decode operation
    if (window.DecodeEngine && jobData) {
      const result = await window.DecodeEngine.process(jobData.input, jobData.options);

      await this.logEvent(this.EventType.DECODE_END, {
        resumed: true,
        result
      }, 'completed');

      return result;
    }

    throw new Error('DecodeEngine not available');
  },

  async resumeImport(importData) {
    // Resume import operation
    if (window.ImportManager && importData) {
      const result = await window.ImportManager.importFile(importData.file, importData.options);

      await this.logEvent(this.EventType.IMPORT_END, {
        resumed: true,
        result
      }, 'completed');

      return result;
    }

    throw new Error('ImportManager not available');
  },

  async resumeExport(exportData) {
    // Resume export operation
    if (window.ExportManager && exportData) {
      const result = await window.ExportManager.exportData(exportData.data, exportData.options);

      await this.logEvent(this.EventType.EXPORT_END, {
        resumed: true,
        result
      }, 'completed');

      return result;
    }

    throw new Error('ExportManager not available');
  },

  async clearIncompleteOperations() {
    if (!this.db) await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(['journal'], 'readwrite');
    const store = transaction.objectStore('journal');
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only('running'));

      request.onsuccess = () => {
        const cursor = request.result;
        const deletePromises = [];

        if (cursor) {
          do {
            deletePromises.push(this.deleteEvent(cursor.value.id));
          } while (cursor.advance());
        }

        Promise.all(deletePromises).then(resolve).catch(reject);
      };

      request.onerror = reject;
    });
  },

  async deleteEvent(eventId) {
    if (!this.db) await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(['journal'], 'readwrite');
    const store = transaction.objectStore('journal');

    return new Promise((resolve, reject) => {
      const request = store.delete(eventId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear() {
    if (typeof window !== 'undefined' && window.crashJournal && window.crashJournal.clear) {
      return window.crashJournal.clear();
    }

    if (!this.db) await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(['journal'], 'readwrite');
    const store = transaction.objectStore('journal');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        this.journal = [];
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  getSessionId() {
    // Generate or retrieve session ID
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return 'no-session-storage';
    }

    let sessionId = window.sessionStorage.getItem('hypersnatch_session_id');

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      window.sessionStorage.setItem('hypersnatch_session_id', sessionId);
    }

    return sessionId;
  },

  async getStats() {
    if (typeof window !== 'undefined' && window.crashJournal && window.crashJournal.getStats) {
      return window.crashJournal.getStats();
    }

    if (!this.db) await this.init();
    if (!this.db) return {};

    const transaction = this.db.transaction(['journal'], 'readonly');
    const store = transaction.objectStore('journal');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const events = request.result || [];

        const stats = {
          totalEvents: events.length,
          byType: {},
          byStatus: {},
          last24Hours: 0,
          lastWeek: 0
        };

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        events.forEach(event => {
          const eventTime = new Date(event.timestamp);

          // Count by type
          stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

          // Count by status
          stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;

          // Count recent events
          if (eventTime >= last24Hours) {
            stats.last24Hours++;
          }

          if (eventTime >= lastWeek) {
            stats.lastWeek++;
          }
        });

        resolve(stats);
      };

      request.onerror = reject;
    });
  },

  // Anomaly Auto-Repair Logic (Round 10)
  async autoRepairAnomalies() {
    const report = await this.detectUncleanShutdown();
    const repairs = [];

    if (report.needsRepair) {
      console.log("[JOURNAL] Anomaly detected, starting auto-repair...");

      // 1. Replay incomplete operations
      const replayResults = await this.replayJournal();
      if (replayResults && Array.isArray(replayResults)) {
        repairs.push(...replayResults.map(r => `Replayed ${r.type}: ${r.replayed ? 'SUCCESS' : 'FAILED'}`));
      }

      // 2. Refresh trust state if potentially corrupted
      if (report.incompleteOperations && report.incompleteOperations[this.EventType.TRUST_CHANGE]) {
        if (window.ExportLayer) {
          window.ExportLayer.ensureTrustStore();
          repairs.push("Refreshed Trust Store Integrity");
        }
      }

      // 3. Log the repair event
      await this.logEvent(this.EventType.ERROR, {
        repairCount: repairs.length,
        details: repairs.join("; ")
      }, 'repaired');
    }

    return repairs;
  }
};

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  window.CrashJournal = CrashJournal;

  // Log app start
  window.addEventListener('load', async () => {
    // Phase 15: Run auto-repair on startup
    try {
      const repairs = await CrashJournal.autoRepairAnomalies();
      if (repairs.length > 0) {
        console.log("[JOURNAL] Auto-repair completed:", repairs);
      }

      await CrashJournal.logEvent(CrashJournal.EventType.APP_START, {
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (e) {
      console.error("[JOURNAL] Startup error:", e);
    }
  });

  // Log app shutdown
  window.addEventListener('beforeunload', async () => {
    try {
      await CrashJournal.logEvent(CrashJournal.EventType.APP_SHUTDOWN, {
        duration: Date.now() - (window.appStartTime || Date.now())
      });
    } catch (e) {
      // ignore shutdown errors
    }
  });
}

module.exports = CrashJournal;
