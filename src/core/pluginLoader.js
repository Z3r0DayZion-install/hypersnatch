const fs = require("fs")
const path = require("path")

/**
 * HyperSnatch Core: Plugin Loader
 * Dynamically loads forensic analysis plugins from a directory.
 */

function loadPlugins(pluginDir) {
    if (!fs.existsSync(pluginDir)) {
        console.warn(`[Loader] Plugin directory not found: ${pluginDir}`);
        return [];
    }

    const plugins = []
    const files = fs.readdirSync(pluginDir)

    files.forEach(file => {
        if (file.endsWith(".js") && !file.endsWith(".test.js")) {
            try {
                const plugin = require(path.resolve(pluginDir, file))
                if (plugin.name && typeof plugin.analyze === 'function') {
                    plugins.push(plugin)
                    console.log(`[Loader] Plugin loaded: ${plugin.name}`);
                }
            } catch (err) {
                console.error(`[Loader] Failed to load plugin ${file}:`, err);
            }
        }
    })

    return plugins
}

module.exports = { loadPlugins }
