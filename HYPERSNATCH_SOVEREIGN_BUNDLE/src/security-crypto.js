// ==================== SECURE CRYPTO MODULE ====================
"use strict";

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SecureCrypto {
  constructor() {
    this.secretKey = null;
    this.keyFile = path.join(os.tmpdir(), '.hypersnatch-key');
    this.initKey();
  }

  initKey() {
    // Try environment variable first
    if (process.env.HYPERSNATCH_SECRET) {
      this.secretKey = crypto.scryptSync(process.env.HYPERSNATCH_SECRET, 'hypersnatch-salt', 32);
      return;
    }

    // Try existing key file
    try {
      if (fs.existsSync(this.keyFile)) {
        const storedKey = fs.readFileSync(this.keyFile);
        this.secretKey = storedKey;
        return;
      }
    } catch (error) {
      // Continue to generate new key
    }

    // Generate new secure key
    this.secretKey = crypto.randomBytes(32);
    try {
      fs.writeFileSync(this.keyFile, this.secretKey);
    } catch (error) {
      // If we can't store the key, it will be regenerated each session
    }
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(12); // GCM IV
      const cipher = crypto.createCipherGCM('aes-256-gcm', this.secretKey);
      cipher.setAAD(Buffer.from('hypersnatch-v1')); // Additional authenticated data
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipherGCM('aes-256-gcm', this.secretKey);
      decipher.setAAD(Buffer.from('hypersnatch-v1'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new SecureCrypto();
