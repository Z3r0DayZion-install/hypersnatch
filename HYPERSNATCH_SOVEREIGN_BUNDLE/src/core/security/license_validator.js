"use strict";

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const log = require('../../utils/logger'); // Adjust path as needed

// A hardcoded secret embedded in the source code (or bytecode later)
// This is intentionally simple for the "Founders" launch to prevent casual editing.
const LICENSE_SECRET_SALT = "hs_founders_v1_secret_9982347x!";

/**
 * Validates a HyperSnatch JSON license key.
 * 
 * Expected JSON structure:
 * {
 *   "email": "user@example.com",
 *   "edition": "Founders",
 *   "issued": "2026-02-21",
 *   "hash": "..." // SHA256(email + edition + issued + SALT)
 * }
 */
function validateLicenseFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return { valid: false, reason: "File not found" };
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const license = JSON.parse(content);

        if (!license.email || !license.edition || !license.issued || !license.hash) {
            return { valid: false, reason: "Malformed license file format" };
        }

        // Reconstruct the expected hash
        const dataString = `${license.email}|${license.edition}|${license.issued}|${LICENSE_SECRET_SALT}`;
        const expectedHash = crypto.createHash('sha256').update(dataString).digest('hex');

        if (license.hash !== expectedHash) {
            log.warn("LICENSE_CHECKSUM_MISMATCH", { email: license.email });
            return { valid: false, reason: "Checksum validation failed. License may be tampered with." };
        }

        log.info("LICENSE_VALIDATED", { email: license.email, edition: license.edition });

        return {
            valid: true,
            email: license.email,
            edition: license.edition,
            issued: license.issued
        };

    } catch (error) {
        log.error("LICENSE_VALIDATION_ERROR", { err: error.message });
        return { valid: false, reason: "Failed to parse license file" };
    }
}

/**
 * Helper to generate a license (typically run on the developer's machine to fulfill orders)
 */
function generateLicense(email, edition, issuedDateString) {
    const dataString = `${email}|${edition}|${issuedDateString}|${LICENSE_SECRET_SALT}`;
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');

    return {
        email,
        edition,
        issued: issuedDateString,
        hash
    };
}

module.exports = {
    validateLicenseFile,
    generateLicense
};
