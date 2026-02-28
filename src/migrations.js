// ==================== SCHEMA MIGRATION ENGINE ====================
"use strict";

const Migrations = {
  // Define migrations for each version
  // Version 1 is the baseline (handled by IndexedSearch.init default)
  registry: {
    2: {
      description: "Add tags index to snapshots and create audit_logs store",
      run: (db, transaction) => {
        // Update snapshots store
        const snapshotStore = transaction.objectStore('snapshots');
        if (!snapshotStore.indexNames.contains('tags')) {
          snapshotStore.createIndex('tags', 'tags', { multiEntry: true });
        }
        
        // Create new store
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp');
          auditStore.createIndex('event', 'event');
        }
      }
    },
    3: {
      description: "Add source_hash index to jobs",
      run: (db, transaction) => {
        const jobStore = transaction.objectStore('jobs');
        if (!jobStore.indexNames.contains('source_hash')) {
          jobStore.createIndex('source_hash', 'source_hash');
        }
      }
    }
  },

  latestVersion: 3,

  /**
   * Run all migrations from oldVersion to latestVersion
   */
  migrate(db, transaction, oldVersion) {
    console.log(`[Migrations] Upgrading database from v${oldVersion} to v${this.latestVersion}`);
    
    for (let v = oldVersion + 1; v <= this.latestVersion; v++) {
      if (this.registry[v]) {
        console.log(`[Migrations] Applying v${v}: ${this.registry[v].description}`);
        try {
          this.registry[v].run(db, transaction);
        } catch (err) {
          console.error(`[Migrations] Error applying version ${v}:`, err);
          throw err;
        }
      }
    }
  }
};

module.exports = Migrations;
