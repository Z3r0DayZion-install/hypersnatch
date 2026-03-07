const vm = require('vm');
const fs = require('fs');
const path = require('path');

/**
 * ResearchSandbox.js
 * Isolated environment for experimental forensic analysis.
 */
class ResearchSandbox {
    constructor(researchDir) {
        this.researchDir = researchDir;
        if (!fs.existsSync(researchDir)) {
            fs.mkdirSync(researchDir, { recursive: true });
        }
    }

    /**
     * Execute an experimental script in the research sandbox.
     */
    async executeResearchScript(scriptName, context = {}) {
        const scriptPath = path.join(this.researchDir, scriptName);
        if (!fs.existsSync(scriptPath)) throw new Error(`Research script not found: ${scriptName}`);

        const code = fs.readFileSync(scriptPath, 'utf8');

        const sandbox = {
            console: {
                log: (...args) => console.log(`[Research]`, ...args),
                error: (...args) => console.error(`[Research]`, ...args)
            },
            ...context,
            module: { exports: {} }
        };

        try {
            vm.createContext(sandbox);
            const script = new vm.Script(code);
            script.runInContext(sandbox, { timeout: 10000 }); // 10s research limit

            return sandbox.module.exports;
        } catch (e) {
            console.error(`Research Sandbox Error:`, e.message);
            throw e;
        }
    }

    listScripts() {
        return fs.readdirSync(this.researchDir).filter(f => f.endsWith('.js'));
    }
}

module.exports = ResearchSandbox;
