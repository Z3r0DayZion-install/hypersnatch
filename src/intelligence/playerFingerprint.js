/**
 * HyperSnatch Intelligence: Player Fingerprint
 * Identified media player version and configuration.
 */

module.exports = {
    name: "Player Fingerprint",
    description: "Identifies the media player type and configuration snapshots.",

    analyze(bundle) {
        const results = {
            playerType: "unknown",
            version: "unknown",
            features: []
        };

        const config = bundle.evidence ? bundle.evidence.player_config : null;
        if (!config) return { artifact: "player_profile.json", data: results };

        if (config.videojs) {
            results.playerType = "Video.js";
            results.version = config.videojs.version || "unknown";
            if (config.videojs.plugins) results.features.push(...Object.keys(config.videojs.plugins));
        } else if (config.dashjs) {
            results.playerType = "Dash.js";
            results.version = config.dashjs.version || "unknown";
        }

        return {
            artifact: "player_profile.json",
            data: results
        }
    }
}
