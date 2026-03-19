const fs = require("fs");
const path = require("path");

/**
 * HyperSnatch Replay: Bundle Loader
 * Ingests .hyper bundles for the replay engine.
 */

class ReplayLoader {
    load(bundleDir) {
        if (!fs.existsSync(bundleDir)) throw new Error("Bundle not found");

        const bundle = {
            evidence: {},
            runtime: {},
            analysis: {},
            meta: {}
        };

        const readDir = (subdir, target) => {
            const dirPath = path.join(bundleDir, subdir);
            if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach(file => {
                    const content = fs.readFileSync(path.join(dirPath, file), "utf8");
                    try {
                        target[file] = JSON.parse(content);
                    } catch (e) {
                        target[file] = content;
                    }
                });
            }
        };

        readDir("evidence", bundle.evidence);
        readDir("runtime", bundle.runtime);
        readDir("analysis", bundle.analysis);
        readDir("meta", bundle.meta);

        return bundle;
    }
}

module.exports = new ReplayLoader();
