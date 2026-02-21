/**
 * SmartDecode 2.0 - Orchestration Module
 * Layered pipeline for deterministic offline extraction.
 */

const DirectExtractor = require('./direct');
const Base64Extractor = require('./base64');
const Unpacker = require('./unpacker');
const ScriptTracer = require('./script-trace');
const IframeExtractor = require('./iframe');
const M3U8Parser = require('./m3u8');
const Ranker = require('./ranker');

const SmartDecode = {
    VERSION: '2.0.0',

    /**
     * Main entry point for SmartDecode 2.0
     * @param {string} rawHtml 
     * @param {number} depth Internal recursion depth
     * @returns {Object} Structured report
     */
    run(rawHtml, depth = 0) {
        if (!rawHtml || typeof rawHtml !== 'string') {
            return { candidates: [], best: null, extractionMap: {} };
        }

        const extractionMap = {
            direct: [],
            base64: [],
            unpacker: [],
            scriptTrace: [],
            iframe: [],
            m3u8: []
        };

        // 1. Direct Layer
        extractionMap.direct = DirectExtractor.extract(rawHtml);

        // 2. Base64 Layer
        extractionMap.base64 = Base64Extractor.extract(rawHtml, DirectExtractor);

        // 3. Unpacker Layer
        extractionMap.unpacker = Unpacker.extract(rawHtml, DirectExtractor);

        // 4. Script Trace Layer
        extractionMap.scriptTrace = ScriptTracer.extract(rawHtml, DirectExtractor);

        // 5. Iframe Recursion (if depth permits)
        if (depth < 3) {
            extractionMap.iframe = IframeExtractor.extract(rawHtml, this.run.bind(this), depth);
        }

        // Combine all intermediate candidates
        const allCandidates = [
            ...extractionMap.direct,
            ...extractionMap.base64,
            ...extractionMap.unpacker,
            ...extractionMap.scriptTrace,
            ...extractionMap.iframe
        ];

        // 6. M3U8 Analysis Layer
        // Scan all found .m3u8 files - in a real scenario we might need to "fetch" local files
        // But since we are strictly offline and take strings, we only parse if the content is inline
        allCandidates.forEach(c => {
            if (c.type === 'hls' && rawHtml.includes('#EXTM3U')) {
                // This is a naive check to see if the master playlist content is present in the same block
                const variants = M3U8Parser.parse(rawHtml, c.url);
                if (variants.length > 0) {
                    extractionMap.m3u8.push(...variants);
                }
            }
        });

        const finalCandidates = [...allCandidates, ...extractionMap.m3u8];

        // 7. Ranking Layer
        const rankedResults = Ranker.rank(finalCandidates);

        return {
            version: this.VERSION,
            candidates: rankedResults.candidates,
            best: rankedResults.best,
            confidenceScore: rankedResults.best ? rankedResults.best.finalScore : 0,
            extractionMap,
            processedAt: new Date().toISOString()
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartDecode;
}
