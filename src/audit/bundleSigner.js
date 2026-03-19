const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * BundleSigner.js
 * Cryptographic signing for HyperSnatch bundles and cases.
 * Utilizes ECDSA (secp256k1) for forensic authenticity.
 */
class BundleSigner {
    constructor(keyPath) {
        this.keyPath = keyPath;
        if (!fs.existsSync(this.keyPath)) {
            fs.mkdirSync(this.keyPath, { recursive: true });
        }
        this.privateKeyPath = path.join(this.keyPath, 'station.key');
        this.publicKeyPath = path.join(this.keyPath, 'station.pub');
    }

    /**
     * Ensure a workstation key pair exists. Generates one if missing.
     * @returns {string} The public key
     */
    ensureKeyPair() {
        if (fs.existsSync(this.privateKeyPath) && fs.existsSync(this.publicKeyPath)) {
            return fs.readFileSync(this.publicKeyPath, 'utf8');
        }

        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        fs.writeFileSync(this.privateKeyPath, privateKey, 'utf8');
        fs.writeFileSync(this.publicKeyPath, publicKey, 'utf8');

        return publicKey;
    }

    /**
     * Sign a data object and return the signature + public key.
     * @param {Object} data Any JSON-serializable object
     * @returns {Object} { signature, publicKey }
     */
    signData(data) {
        const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
        const sign = crypto.createSign('SHA256');

        // Canonicalize the data for deterministic signing
        const content = JSON.stringify(this._canonicalize(data));
        sign.update(content);
        sign.end();

        const signature = sign.sign(privateKey, 'hex');
        const publicKey = fs.readFileSync(this.publicKeyPath, 'utf8');

        return { signature, publicKey };
    }

    /**
     * Create a hash manifest of multiple files.
     * @param {Array} filePaths List of absolute paths
     * @returns {Object} { filename: hash }
     */
    createManifest(filePaths) {
        const manifest = {};
        filePaths.forEach(fp => {
            if (fs.existsSync(fp)) {
                const content = fs.readFileSync(fp);
                const hash = crypto.createHash('sha256').update(content).digest('hex');
                manifest[path.basename(fp)] = hash;
            }
        });
        return manifest;
    }

    /**
     * Deterministic JSON stringification (sort keys)
     * @private
     */
    _canonicalize(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this._canonicalize(item));

        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = this._canonicalize(obj[key]);
        });
        return sorted;
    }
}

module.exports = BundleSigner;
