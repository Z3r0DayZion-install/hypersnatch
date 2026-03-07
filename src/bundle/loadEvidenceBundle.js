const BundleValidator = require('./validateBundle');
const path = require('path');

class EvidenceLoader {
    /**
     * Loads, parses, and explicitly validates a target evidence bundle directory.
     * @param {string} targetDir Absolute or relative path to evidence target folder
     * @returns {Object} Extracted JSON manifests and validation status
     */
    static load(targetDir) {
        // Run rigorous validation first
        const validation = BundleValidator.validate(targetDir);

        return {
            sourcePath: path.resolve(targetDir),
            isValid: validation.valid,
            validationStatus: validation.status,
            validationErrors: validation.errors,
            validationWarnings: validation.warnings,

            // Normalized artifact properties (will be empty/null if severely invalid)
            artifacts: {
                har: validation.parsedArtifacts['har_classified.json'] || null,
                player: validation.parsedArtifacts['player_profile.json'] || null,
                candidates: validation.parsedArtifacts['stream_candidates.json'] || null,
                manifest: validation.parsedArtifacts['manifest.json'] || null
            }
        };
    }
}

module.exports = EvidenceLoader;
