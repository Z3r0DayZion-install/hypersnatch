const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BundleValidator {
    /**
     * Validates an entire evidence bundle.
     * Expected JSON schemas defined in ARTIFACT_SCHEMA.md.
     */
    static validate(targetDir) {
        let result = {
            valid: true,
            status: "PASS",
            errors: [],
            warnings: [],
            parsedArtifacts: {}
        };

        if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
            result.valid = false;
            result.status = "FAIL";
            result.errors.push(`Directory does not exist or is not a directory: ${targetDir}`);
            return result;
        }

        const requiredFiles = [
            'har_classified.json',
            'player_profile.json',
            'stream_candidates.json',
            'report.md',
            'manifest.json'
        ];

        // 1 & 2. Check required files
        for (const file of requiredFiles) {
            const filePath = path.join(targetDir, file);
            if (!fs.existsSync(filePath)) {
                result.valid = false;
                result.status = "FAIL";
                result.errors.push(`Missing required artifact: ${file}`);
            } else if (file.endsWith('.json')) {
                // 3. Check JSON parse
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    result.parsedArtifacts[file] = JSON.parse(content);
                } catch (e) {
                    result.valid = false;
                    result.status = "FAIL";
                    result.errors.push(`Invalid JSON syntax in ${file}: ${e.message}`);
                }
            }
        }

        // If core files are missing or unparseable, don't cascade into deep schema failures
        if (!result.valid) return result;

        // 4. Schema Field Validation
        const har = result.parsedArtifacts['har_classified.json'];
        const player = result.parsedArtifacts['player_profile.json'];
        const stream = result.parsedArtifacts['stream_candidates.json'];
        const manifest = result.parsedArtifacts['manifest.json'];

        if (!har.manifests && !har.segments) {
            result.valid = false;
            result.status = "FAIL";
            result.errors.push('har_classified.json missing manifests or segments array');
        }

        if (!player.player || player.confidence === undefined) {
            result.valid = false;
            result.status = "FAIL";
            result.errors.push('player_profile.json missing player or confidence');
        }

        if (!Array.isArray(stream)) {
            result.valid = false;
            result.status = "FAIL";
            result.errors.push('stream_candidates.json root must be an array');
        } else {
            // Check warnings (e.g., quality hint)
            stream.forEach((c, idx) => {
                if (!c.url || !c.type || c.finalScore === undefined) {
                    result.valid = false;
                    result.status = "FAIL";
                    result.errors.push(`stream_candidates.json candidate[${idx}] missing url, type, or finalScore`);
                }
                if (!c.certaintyTier) {
                    result.warnings.push(`stream_candidates.json candidate[${idx}] missing optional certaintyTier`);
                    if (result.status === "PASS") result.status = "PASS_WITH_WARNINGS";
                }
            });
        }

        const reportPath = path.join(targetDir, 'report.md');
        const reportContent = fs.readFileSync(reportPath, 'utf8');
        if (!reportContent.includes('## Core Stream Extraction') || !reportContent.includes('## Architecture Discovery')) {
            result.warnings.push('report.md appears to be missing standard section headings');
            if (result.status === "PASS") result.status = "PASS_WITH_WARNINGS";
        }

        if (!manifest.hashes || Object.keys(manifest.hashes).length === 0) {
            result.valid = false;
            result.status = "FAIL";
            result.errors.push('manifest.json missing "hashes" object');
        }

        // Return early if schema blew up violently to avoid hash verifier exploding
        if (!result.valid) return result;

        // 5 & 6. SHA-256 Hash Verification
        result.parsedArtifacts.hashVerification = { matched: 0, failed: 0, mismatchList: [] };

        for (const [filename, expectedHash] of Object.entries(manifest.hashes)) {
            const filepath = path.join(targetDir, filename);
            if (!fs.existsSync(filepath)) {
                result.valid = false;
                result.status = "FAIL";
                result.errors.push(`manifest references missing file: ${filename}`);
                continue;
            }

            const rawContent = fs.readFileSync(filepath);
            const actualHash = crypto.createHash('sha256').update(rawContent).digest('hex');

            if (actualHash !== expectedHash) {
                result.valid = false;
                result.status = "FAIL";
                result.errors.push(`Hash mismatch on ${filename} (Expected: ${expectedHash}, Actual: ${actualHash})`);
                result.parsedArtifacts.hashVerification.failed++;
                result.parsedArtifacts.hashVerification.mismatchList.push(filename);
            } else {
                result.parsedArtifacts.hashVerification.matched++;
            }
        }

        return result;
    }
}

module.exports = BundleValidator;
