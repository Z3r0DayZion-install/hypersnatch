// ==================== SOVEREIGN AUTH // ECDSA HARDWARE LICENSING ====================
"use strict";

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SovereignAuth = {
  // Public Key for the App (The "Verification Key")
  // In a real production environment, this would be a secp256k1 public key.
  // For this implementation, we use a robust public key derived from our Authority.
  AUTHORITY_PUBLIC_KEY: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE05ETUtxYosYRcTjGlcWvJKS5qr93maWM
z3WLVPL7WhyqbG9zM9glepDBZYdnyc1Aq8u7aJ2s9q9BBbXRbmdJ1Q==
-----END PUBLIC KEY-----`,

  /**
   * Validates a HyperSnatch license
   * @param {Object} license - The license object
   * @param {string} hwFingerprint - The current machine's hardware fingerprint
   */
  verifyLicense(license, hwFingerprint) {
    try {
      if (!license || !license.signature || !license.payload) {
        return { valid: false, reason: "Incomplete License Data" };
      }

      const payload = license.payload;

      // 1. Hardware Binding Check
      if (payload.hwid !== hwFingerprint) {
        return { valid: false, reason: "Hardware ID Mismatch - License bound to another machine." };
      }

      // 2. Expiry Check
      const expiry = new Date(payload.expiry);
      if (expiry < new Date()) {
        return { valid: false, reason: "License Expired" };
      }

      // 3. Cryptographic Signature Verification (ECDSA secp256k1)
      const verify = crypto.createVerify('SHA256');
      verify.update(JSON.stringify(payload));
      verify.end();

      const isValid = verify.verify(
        this.AUTHORITY_PUBLIC_KEY,
        license.signature,
        'hex'
      );

      if (!isValid) {
        return { valid: false, reason: "Cryptographic Signature Invalid - License tampered or forged." };
      }

      return {
        valid: true,
        tier: payload.edition || 'COMMUNITY',
        edition: payload.edition || 'COMMUNITY',
        user: payload.user || 'Anonymous Analyst',
        features: payload.features || []
      };
    } catch (err) {
      return { valid: false, reason: "Verification Critical Error: " + err.message };
    }
  },

  /**
   * Internal generator (used by the Founder to create keys)
   */
  // Tier hierarchy for gating checks
  TIER_LEVELS: {
    'COMMUNITY': 0,
    'SOVEREIGN': 1,
    'INSTITUTIONAL': 2
  },

  // Feature definitions per tier
  TIER_FEATURES: {
    COMMUNITY: [
      'UNLIMITED_ANALYSIS',
      'JSON_EXPORT'
    ],
    SOVEREIGN: [
      'UNLIMITED_ANALYSIS',
      'JSON_EXPORT',
      'PDF_EXPORT',
      'FINAL_FREEZE',
      'AUDIT_CHAIN',
      'QUANTUM_VAULT',
      'EVIDENCE_VAULT',
      'POLICY_SHIELD'
    ],
    INSTITUTIONAL: [
      'UNLIMITED_ANALYSIS',
      'JSON_EXPORT',
      'PDF_EXPORT',
      'FINAL_FREEZE',
      'AUDIT_CHAIN',
      'QUANTUM_VAULT',
      'EVIDENCE_VAULT',
      'POLICY_SHIELD',
      'HEADLESS_CLI',
      'SITE_LICENSE_5',
      'PRIORITY_SUPPORT'
    ]
  },

  /**
   * Check if a tier meets or exceeds the required minimum tier.
   * @param {string} currentTier
   * @param {string} requiredTier
   * @returns {boolean}
   */
  meetsMinimumTier(currentTier, requiredTier) {
    const current = this.TIER_LEVELS[currentTier] ?? 0;
    const required = this.TIER_LEVELS[requiredTier] ?? 0;
    return current >= required;
  },

  /**
   * Check if a tier has a specific feature.
   * @param {string} tier
   * @param {string} feature
   * @returns {boolean}
   */
  hasFeature(tier, feature) {
    const features = this.TIER_FEATURES[tier] || this.TIER_FEATURES.COMMUNITY;
    return features.includes(feature);
  },

  generateLicensePayload(user, hwid, edition = "SOVEREIGN") {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1); // 1 Year default

    const features = this.TIER_FEATURES[edition] || this.TIER_FEATURES.COMMUNITY;

    return {
      user,
      hwid,
      edition,
      expiry: expiry.toISOString(),
      issued: new Date().toISOString(),
      features,
      version: '1.0.0'
    };
  },

  /**
   * Derives a persistent, machine-bound cryptographic key for local sealing.
   * @param {string} hwFingerprint 
   * @param {string} salt 
   * @returns {Buffer} Derived Key
   */
  getPersistentKey(hwFingerprint, salt = "SOVEREIGN_SALT_2026") {
    if (!hwFingerprint) throw new Error("Hardware Fingerprint Required for Key Derivation");

    // Use PBKDF2 to derive a robust key from the HWID
    return crypto.pbkdf2Sync(
      hwFingerprint,
      salt,
      600000, // Hardened iterations
      32,     // Key Length (256-bit)
      'sha256'
    );
  },

  /**
   * Seals a session key using the hardware-bound persistent key.
   * @param {Buffer} sessionKey 
   * @param {string} hwFingerprint 
   * @returns {Object} { encryptedKey: string, iv: string, authTag: string }
   */
  sealSessionKey(sessionKey, hwFingerprint) {
    const masterKey = this.getPersistentKey(hwFingerprint, "SESSION_SEAL_v1");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

    let encrypted = cipher.update(sessionKey, null, 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedKey: encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex')
    };
  }
};

module.exports = SovereignAuth;
