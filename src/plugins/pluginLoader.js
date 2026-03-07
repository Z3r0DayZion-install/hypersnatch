const fs = require('fs');
const path = require('path');

/**
 * PluginLoader.js
 * Handles dynamic loading and metadata validation for forensic plugins.
 */
class PluginLoader {
    constructor(pluginDir) {
        this.pluginDir = pluginDir;
        this.plugins = new Map();
        if (!fs.existsSync(pluginDir)) {
            fs.mkdirSync(pluginDir, { recursive: true });
        }
    }

    /**
     * Load all plugins from the plugin directory.
     */
    loadAll() {
        const entries = fs.readdirSync(this.pluginDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                this.loadPlugin(path.join(this.pluginDir, entry.name));
            }
        }
        return Array.from(this.plugins.values());
    }

    /**
     * Load a specific plugin.
     */
    loadPlugin(pluginPath) {
        const manifestPath = path.join(pluginPath, 'manifest.json');
        if (!fs.existsSync(manifestPath)) return null;

        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            this.validateManifest(manifest);

            const mainPath = path.join(pluginPath, manifest.main || 'index.js');
            if (!fs.existsSync(mainPath)) {
                throw new Error(`Main file not found: ${manifest.main}`);
            }

            const pluginRecord = {
                id: manifest.id,
                name: manifest.name,
                version: manifest.version,
                capabilities: manifest.capabilities || [],
                path: pluginPath,
                main: mainPath,
                enabled: true,
                loadedAt: new Date().toISOString()
            };

            this.plugins.set(manifest.id, pluginRecord);
            return pluginRecord;
        } catch (e) {
            console.error(`Failed to load plugin at ${pluginPath}:`, e.message);
            return null;
        }
    }

    validateManifest(manifest) {
        const required = ['id', 'name', 'version'];
        for (const field of required) {
            if (!manifest[field]) throw new Error(`Missing manifest field: ${field}`);
        }
    }

    getPlugin(id) {
        return this.plugins.get(id);
    }

    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
}

module.exports = PluginLoader;
