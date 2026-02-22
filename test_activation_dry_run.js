const fs = require('fs');
const path = require('path');

// Mock electron so the logger doesn't crash in pure Node
require('module').Module._cache[require.resolve('electron')] = {
    exports: { app: { getPath: () => __dirname } }
};

let validator;
try {
    validator = require('./src/core/security/license_validator.js');
} catch (e) {
    console.log('Could not load validator:', e.message);
    process.exit(1);
}

function runTests() {
    console.log("--- ACTIVATION FLOW DRY RUN ---");

    // 1. Generate valid key
    const validKeyData = validator.generateLicense('test_user@hypersnatch.com', 'Founders', '2026-02-21');
    fs.writeFileSync('test_valid.json', JSON.stringify(validKeyData));

    // 2. Simulate validation
    const validResult = validator.validateLicenseFile('test_valid.json');
    console.log("2. Valid key verification result:", validResult.valid ? "SUCCESS" : "FAILURE");

    // 3. Corrupted key test
    const corruptKeyData = { ...validKeyData, signature: 'bad_signature_deadbeef', hash: 'bad' };
    fs.writeFileSync('test_corrupt.json', JSON.stringify(corruptKeyData));
    const corruptResult = validator.validateLicenseFile('test_corrupt.json');
    console.log("3. Corrupted key verification result:", !corruptResult.valid ? "SUCCESS (Rejected)" : "FAILURE (Accepted)");

    // 4. Missing/Empty test
    fs.writeFileSync('test_empty.json', JSON.stringify({}));
    const emptyResult = validator.validateLicenseFile('test_empty.json');
    console.log("4. Empty key verification result:", !emptyResult.valid ? "SUCCESS (Rejected)" : "FAILURE (Accepted)");

    // Cleanup
    fs.unlinkSync('test_valid.json');
    fs.unlinkSync('test_corrupt.json');
    fs.unlinkSync('test_empty.json');
    console.log("--- DRY RUN COMPLETE ---");
}

runTests();
