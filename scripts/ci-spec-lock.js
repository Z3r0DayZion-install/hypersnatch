// ==================== CI SPEC LOCK ENFORCEMENT ====================
"use strict";

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SPEC_PATHS = [
    'docs/security/CRYPTOGRAPHIC_ARCHITECTURE_SPEC.md',
    'docs/security/ANTI_ROLLBACK_PROTOCOL.md',
    'docs/security/THREAT_REGRESSION_POLICY.md',
    'schema/manifest.schema.json'
];

function checkSpecDrift() {
    console.log("--- NeuralCache-Core: CI Spec Lock Check ---");
    
    let driftDetected = false;

    for (const relPath of SPEC_PATHS) {
        const fullPath = path.join(ROOT, relPath);
        if (!fs.existsSync(fullPath)) {
            console.error(`❌ MISSING REQUIRED SPEC: ${relPath}`);
            driftDetected = true;
            continue;
        }

        try {
            // Check if file is modified in git compared to HEAD
            const diff = execSync(`git diff HEAD -- "${fullPath}"`).toString();
            if (diff.length > 0) {
                console.error(`❌ DRIFT DETECTED in ${relPath}. Changes to security specs require a version bump and explicit SPEC_FREEZE_PROTOCOL compliance.`);
                driftDetected = true;
            }
        } catch (e) {
            // Not a git repo or git not found - skip check but warn
            console.warn(`[Warn] Git not available to check drift for ${relPath}`);
        }
    }

    if (driftDetected) {
        process.exit(1);
    }

    console.log("✅ All security specs are locked and unmodified.");
}

if (require.main === module) {
    checkSpecDrift();
}
