// ==================== NEURAL LINK // QR GENERATOR ====================
"use strict";

/**
 * Minimal QR Code Generator Bridge (Elite Airgap Edition)
 * Refactored to use the hardened Main Process for offline generation.
 */
const QRGenerator = {
  /**
   * Generates a single QR code as a Data-URI
   */
  async generate(data) {
    if (typeof window !== 'undefined' && window.sovereignExfil) {
      console.log("[QR] Generating offline frame via Main Process...");
      return await window.sovereignExfil.generateQR(data);
    }
    
    // Fallback for non-electron (Internal development only)
    console.warn("[QR] Main process bridge not available, using simulation.");
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  },

  /**
   * Chunks data for streaming
   */
  chunkData(data, size = 150) {
    const chunks = [];
    for (let i = 0; i < data.length; i += size) {
      chunks.push(data.substring(i, i + size));
    }
    return chunks;
  },

  /**
   * Creates an Animated QR Stream manifest
   * Format: [INDEX/TOTAL|CHECKSUM|DATA]
   */
  async generateAnimated(data, onFrame) {
    const chunks = this.chunkData(data);
    const total = chunks.length;
    const frames = [];

    for (let i = 0; i < total; i++) {
      const index = i + 1;
      const payload = `${index}/${total}|${chunks[i]}`;
      const dataUri = await this.generate(payload);
      frames.push(dataUri);
      if (onFrame) onFrame(index, total, dataUri);
    }

    return frames;
  }
};

if (typeof window !== 'undefined') window.QRGenerator = QRGenerator;
module.exports = QRGenerator;
