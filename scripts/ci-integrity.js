// ==================== CI INTEGRITY ENFORCEMENT ====================
"use strict";

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SPEC_PATHS = [
    'docs/security/CRYPTOGRAPHIC_ARCHITECTURE_SPEC.md',
    'docs/security/ANTI_ROLLBACK_PROTOCOL.md',
    'docs/security/THREAT_REGRESSION_POLICY.md',
    'release/manifest.schema.json'
];

function checkIntegrity() {
    console.log("--- NeuralCache-Core: CI Integrity & Spec Lock ---");
    
    let failure = false;

    // 1. Spec Drift Check
    for (const relPath of SPEC_PATHS) {
        const fullPath = path.join(ROOT, relPath);
        if (!fs.existsSync(fullPath)) {
            console.error(`❌ MISSING REQUIRED ARTIFACT: ${relPath}`);
            failure = true;
            continue;
        }

        try {
            const diff = execSync(`git diff HEAD -- "${fullPath}"`, { stdio: 'pipe' }).toString();
            if (diff.length > 0) {
                console.error(`❌ DRIFT DETECTED: ${relPath}. Spec freeze violation.`);
                failure = true;
            }
        } catch (e) {
            console.warn(`[Warn] Git drift check skipped for ${relPath}`);
        }
    }

    // 2. Functional Isolation & Regression Tests
    try {
        console.log("--- Running Core Isolation & Regression Suite ---");
        execSync(`node "${path.join(ROOT, 'tests/nc-isolation.test.js')}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error("❌ REGRESSION DETECTED: Core Isolation tests failed.");
        failure = true;
    }

    if (failure) {
        console.error("--- CI INTEGRITY FAILED ---");
        process.exit(1);
    }

    console.log("--- CI INTEGRITY PASSED ---");
}

if (require.main === module) {
    checkIntegrity();
}
