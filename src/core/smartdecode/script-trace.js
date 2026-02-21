/**
 * SmartDecode 2.0 - Script Tracing Module
 * Statistically parses <script> blocks to trace variable assignments and resolve stream URLs.
 * High-performance regex-based AST-lite analysis. No live execution.
 */

const ScriptTracer = {
    // Patterns for variable assignments and simple transformations
    PATTERNS: {
        SCRIPT_BLOCK: /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
        VAR_ASSIGN: /(?:var|const|let|window\.|this\.)\s+(\w+)\s*=\s*["']([^"']+)["']/gi,
        TRACED_VAR: /(?:var|const|let|window\.|this\.)?\s*(\w+)\s*=\s*(\w+)\s*;/gi,
        FUNC_CALL: /(?:var|const|let|window\.|this\.)?\s*(\w+)\s*=\s*(atob|decodeURIComponent|unescape)\s*\(\s*(\w+)\s*\)/gi
    },

    /**
     * Scan input for script-based variable chains
     * @param {string} input 
     * @param {Object} directExtractor Reference to direct.js
     * @returns {Array} List of candidate objects
     */
    extract(input, directExtractor) {
        if (!input || typeof input !== 'string') return [];

        const candidates = new Map();
        const variables = new Map(); // Store resolved variable values

        let scriptMatch;
        this.PATTERNS.SCRIPT_BLOCK.lastIndex = 0;

        while ((scriptMatch = this.PATTERNS.SCRIPT_BLOCK.exec(input)) !== null) {
            const scriptContent = scriptMatch[1];

            // 1. Initial pass: Collect direct string assignments
            let assignMatch;
            this.PATTERNS.VAR_ASSIGN.lastIndex = 0;
            while ((assignMatch = this.PATTERNS.VAR_ASSIGN.exec(scriptContent)) !== null) {
                variables.set(assignMatch[1], assignMatch[2]);
            }

            // 2. Second pass: Trace transformations (atob, etc.)
            // We run this a couple of times to handle simple chains
            for (let i = 0; i < 3; i++) {
                let callMatch;
                this.PATTERNS.FUNC_CALL.lastIndex = 0;
                while ((callMatch = this.PATTERNS.FUNC_CALL.exec(scriptContent)) !== null) {
                    const target = callMatch[1];
                    const func = callMatch[2];
                    const sourceVar = callMatch[3];

                    if (variables.has(sourceVar)) {
                        const val = variables.get(sourceVar);
                        const resolved = this._applyFunc(func, val);
                        if (resolved) variables.set(target, resolved);
                    }
                }

                let traceMatch;
                this.PATTERNS.TRACED_VAR.lastIndex = 0;
                while ((traceMatch = this.PATTERNS.TRACED_VAR.exec(scriptContent)) !== null) {
                    const target = traceMatch[1];
                    const source = traceMatch[2];
                    if (variables.has(source)) {
                        variables.set(target, variables.get(source));
                    }
                }
            }

            // 3. Check all resolved variables for stream patterns
            for (const [name, value] of variables.entries()) {
                const found = directExtractor.extract(value);
                found.forEach(c => {
                    const key = c.url;
                    if (!candidates.has(key)) {
                        candidates.set(key, {
                            ...c,
                            sourceLayer: `script_trace_${name}`,
                            confidence: c.confidence * 0.9 // High confidence for traced variables
                        });
                    }
                });
            }
        }

        return Array.from(candidates.values());
    },

    _applyFunc(func, val) {
        try {
            if (func === 'atob') return typeof atob === 'function' ? atob(val) : Buffer.from(val, 'base64').toString('binary');
            if (func === 'decodeURIComponent') return decodeURIComponent(val);
            if (func === 'unescape') return unescape(val);
        } catch (e) {
            return null;
        }
        return null;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScriptTracer;
}
