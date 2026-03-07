/**
 * HyperSnatch Forensic Plugin Template
 * All Phase 7 intelligence and analysis modules should follow this structure.
 */

module.exports = {
    name: "plugin-name",
    description: "Explain what the plugin analyzes",

    /**
     * analyze(bundle)
     * @param {Object} bundle - The .hyper evidence bundle (parsed JSON)
     * @returns {Object} { artifact: string, data: Object }
     */
    analyze(bundle) {
        const results = {}

        // Access evidence bundle components
        const evidence = bundle.evidence || {}
        const analysis = bundle.analysis || {}
        const runtime = bundle.runtime || {}
        const meta = bundle.meta || {}

        // Perform analysis logic here
        // results.siteType = ...

        return {
            artifact: "intelligence_output.json",
            data: results
        }
    }
}
