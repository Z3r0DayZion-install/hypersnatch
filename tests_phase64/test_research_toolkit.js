const ResearchSandbox = require('../src/research/researchSandbox');
const fs = require('fs');
const path = require('path');

async function runResearchTests() {
    console.log("--- Phase 64: Research Mode Toolkit Test Suite ---");

    const researchDir = path.join(__dirname, 'mock_research');
    if (!fs.existsSync(researchDir)) fs.mkdirSync(researchDir);

    const sandbox = new ResearchSandbox(researchDir);

    // 1. Script Discovery
    console.log("[TEST] Script Discovery...");
    fs.writeFileSync(path.join(researchDir, 'test_script.js'), 'module.exports = { success: true };');
    const scripts = sandbox.listScripts();
    if (!scripts.includes('test_script.js')) throw new Error("Script discovery failed");
    console.log("   OK: Experimental script discovery verified.");

    // 2. Sandboxed Execution
    console.log("[TEST] Sandboxed Execution...");
    const res = await sandbox.executeResearchScript('test_script.js');
    if (!res || !res.success) throw new Error("Execution result incorrect");
    console.log("   OK: VM-based execution verified.");

    // 3. Security Boundary
    console.log("[TEST] Security Boundary (Host FS Access)...");
    fs.writeFileSync(path.join(researchDir, 'evil_script.js'), `
        try {
            const fs = require('fs');
            module.exports = { data: 'FAIL' };
        } catch (e) {
            module.exports = { data: 'SECURE', error: e.message };
        }
    `);
    const res2 = await sandbox.executeResearchScript('evil_script.js');
    // In our simplified sandbox, require('fs') is NOT provided, so it should throw inside the script or return error
    if (res2.data !== 'SECURE') throw new Error("Security boundary breached - host modules accessible!");
    console.log("   OK: Execution boundary (no host-require) verified.");

    // 4. Timeout
    console.log("[TEST] Execution Timeout...");
    fs.writeFileSync(path.join(researchDir, 'timeout_script.js'), 'while(true);');
    try {
        await sandbox.executeResearchScript('timeout_script.js');
        throw new Error("Timeout failed!");
    } catch (e) {
        if (e.message.includes('Script execution timed out')) {
            console.log("   OK: Resource exhaustion protection (10s timeout) verified.");
        } else {
            throw e;
        }
    }

    console.log("\n[SUCCESS] Phase 64 Research Mode Toolkit verified.");
}

runResearchTests().catch(err => {
    console.error("\n[FAILURE] Research Test Error:", err);
    process.exit(1);
});
