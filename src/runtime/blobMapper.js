/**
 * HyperSnatch Phase 6: Blob Mapper
 * Maps internal blob URLs to source data / metadata.
 */

class BlobMapper {
    constructor() {
        this.mappings = new Map();
    }

    start() {
        const self = this;
        const originalCreateObjectURL = URL.createObjectURL;
        const originalRevokeObjectURL = URL.revokeObjectURL;

        URL.createObjectURL = function (obj) {
            const url = originalCreateObjectURL.apply(this, arguments);
            self.mappings.set(url, {
                created: Date.now(),
                type: obj.type,
                size: obj.size,
                isBlob: obj instanceof Blob
            });
            return url;
        };

        URL.revokeObjectURL = function (url) {
            if (self.mappings.has(url)) {
                self.mappings.get(url).revoked = Date.now();
            }
            return originalRevokeObjectURL.apply(this, arguments);
        };
    }

    getMappings() {
        return Object.fromEntries(this.mappings);
    }
}

module.exports = new BlobMapper();
