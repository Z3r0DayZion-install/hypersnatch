"use strict";

const fs = require('fs');
const path = require('path');

const HostExtractors = {
    extractors: new Map(),

    init() {
        const hostsDir = path.join(__dirname, 'hosts');
        if (!fs.existsSync(hostsDir)) return;

        const files = fs.readdirSync(hostsDir);
        for (const file of files) {
            if (file.endsWith('.js') && file !== 'index.js') {
                try {
                    const extractor = require(path.join(hostsDir, file));
                    const hostName = file.replace('.js', '');
                    this.extractors.set(hostName, extractor);
                } catch (e) {
                    console.error(`Failed to load host extractor ${file}:`, e);
                }
            }
        }
    },

    extractAll(input) {
        const allCandidates = [];
        for (const [name, extractor] of this.extractors.entries()) {
            if (typeof extractor.extract === 'function') {
                const candidates = extractor.extract(input);
                allCandidates.push(...candidates);
            }
        }
        return allCandidates;
    }
};

HostExtractors.init();

module.exports = HostExtractors;
