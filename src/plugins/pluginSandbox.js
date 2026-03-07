const vm = require('vm');
const fs = require('fs');

/**
 * PluginSandbox.js
 * Executes forensic plugins in a restricted environment.
 */
class PluginSandbox {
    /**
     * Run a plugin function in a sandbox.
     * @param {string} code Path to plugin script or raw code
     * @param {Object} context Context variables provided to the plugin
     */
    async run(scriptPath, context = {}) {
        const code = fs.readFileSync(scriptPath, 'utf8');

        const sandbox = {
            console: {
                log: (...args) => console.log(`[Plugin]`, ...args),
                error: (...args) => console.error(`[Plugin]`, ...args)
            },
            ...context,
            module: { exports: {} }
        };

        try {
            vm.createContext(sandbox);
            const script = new vm.Script(code);
            script.runInContext(sandbox, { timeout: 5000 }); // 5s execution limit

            const exports = sandbox.module.exports;
            return exports;
        } catch (e) {
            console.error(`Plugin Sandbox Error:`, e.message);
            throw e;
        }
    }
}

module.exports = PluginSandbox;
