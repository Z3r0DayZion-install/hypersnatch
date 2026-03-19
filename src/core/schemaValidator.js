/**
 * HyperSnatch Core: Schema Validator
 * Ensures intelligence and replay artifacts meet institutional standards.
 */

class SchemaValidator {
    constructor() {
        this.schemas = {
            "site_profile.json": ["site_domain", "player", "confidence"],
            "player_profile.json": ["player_name", "fingerprint_signals"],
            "token_rules.json": ["token_type", "ttl_seconds"],
            "cdn_topology.json": ["origin", "edges", "provider"],
            "replay_timeline.json": ["segments_loaded", "bitrate_switches"]
        };
    }

    /**
     * validate(filename, data)
     * @param {string} filename - The artifact filename (e.g. 'site_profile.json')
     * @param {Object} data - The artifact data to validate
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate(filename, data) {
        const errors = [];
        const requiredFields = this.schemas[filename];

        if (!requiredFields) {
            return { valid: true, errors: [] }; // No schema defined, skip validation
        }

        requiredFields.forEach(field => {
            if (!(field in data)) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = new SchemaValidator();
