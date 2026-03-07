class ParsedBundleStore {
    constructor() {
        this.activeBundle = null;
        this.listeners = [];
    }

    /**
     * Set the current active bundle loaded via EvidenceLoader
     */
    setActiveBundle(bundleParam) {
        this.activeBundle = Object.freeze(bundleParam);
        this.emitChange();
    }

    /**
     * Normalizes the bundle state into a UI-consumable shape
     */
    getNormalizedState() {
        if (!this.activeBundle) {
            return {
                isLoaded: false,
                sourcePath: null,
                validation: { status: 'EMPTY', errors: [], warnings: [] },
                data: null
            };
        }

        const b = this.activeBundle;
        return {
            isLoaded: true,
            sourcePath: b.sourcePath,
            validation: {
                status: b.validationStatus,
                errors: b.validationErrors,
                warnings: b.validationWarnings
            },
            data: {
                har: b.artifacts.har,
                player: b.artifacts.player,
                candidates: Array.isArray(b.artifacts.candidates) ? b.artifacts.candidates : [],
                manifest: b.artifacts.manifest,
                targetUrl: b.artifacts.manifest ? b.artifacts.manifest.target : 'Unknown Target'
            }
        };
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    emitChange() {
        const state = this.getNormalizedState();
        this.listeners.forEach(l => l(state));
    }
}

// Singleton export
module.exports = new ParsedBundleStore();
