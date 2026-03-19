const PluginLoader = require('../src/plugins/pluginLoader');
const PluginSandbox = require('../src/plugins/pluginSandbox');
const path = require('path');
const fs = require('fs');

async function runPluginTests() {
    console.log("--- Phase 60: Plugin Ecosystem Test Suite ---");

    const pluginDir = path.join(__dirname, 'mock_plugin');
    const loader = new PluginLoader(path.dirname(pluginDir));
    const sandbox = new PluginSandbox();

    // 1. Loading
    console.log("[TEST] Plugin Manifest Loading...");
    const plugin = loader.loadPlugin(pluginDir);
    if (!plugin || plugin.id !== 'forensic-analyzer-01') throw new Error("Plugin loading failed");
    console.log(`   OK: Loaded "${plugin.name}" with ${plugin.capabilities.length} capabilities.`);

    // 2. Sandboxed Execution
    console.log("[TEST] Sandboxed Capability Execution...");
    const pluginFunc = await sandbox.run(plugin.main, {
        analyst: 'STATION_01'
    });

    // In our implementation, the plugin module.exports is the function
    const result = pluginFunc('ANALYZE_METADATA', { headers: {} });
    if (result.status !== 'MATCH' || result.confidence !== 0.95) {
        throw new Error("Plugin execution returned incorrect result");
    }
    console.log("   OK: Plugin successfully executed in sandbox.");

    // 3. Security Boundary Check
    console.log("[TEST] Security Boundary Check...");
    const maliciousCode = `
        module.exports = () => {
            try { return process.env; } catch(e) { return 'ACCESS_DENIED'; }
        }
    `;
    const maliciousPath = path.join(__dirname, 'malicious.js');
    fs.writeFileSync(maliciousPath, maliciousCode);

    try {
        const maliciousFunc = await sandbox.run(maliciousPath);
        const secResult = maliciousFunc();
        if (secResult !== 'ACCESS_DENIED') throw new Error("Sandbox escape: process is accessible!");
        console.log("   OK: Security boundary enforced (process.env inaccessible).");
    } finally {
        if (fs.existsSync(maliciousPath)) fs.unlinkSync(maliciousPath);
    }

    console.log("\n[SUCCESS] Phase 60 Plugin Ecosystem verified.");
}

runPluginTests().catch(err => {
    console.error("\n[FAILURE] Plugin Test Error:", err);
    process.exit(1);
});
