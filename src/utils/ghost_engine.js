// ==================== GHOST ENGINE // STEGANOGRAPHIC CONCEALMENT ====================
"use strict";

const GhostEngine = {
  /**
   * Hides binary data inside the LSB of a carrier image
   */
  async cloak(imageBlob, dataString) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Convert data to bitstream
        // We prepend a 32-bit length header
        const dataBuffer = new TextEncoder().encode(dataString);
        const length = dataBuffer.length;
        const totalBuffer = new Uint8Array(4 + length);
        
        // Write length header (Big Endian)
        totalBuffer[0] = (length >> 24) & 0xFF;
        totalBuffer[1] = (length >> 16) & 0xFF;
        totalBuffer[2] = (length >> 8) & 0xFF;
        totalBuffer[3] = length & 0xFF;
        totalBuffer.set(dataBuffer, 4);

        if (totalBuffer.length * 8 > pixels.length * 0.75) {
          return reject(new Error("Data too large for this carrier image."));
        }

        let bitIndex = 0;
        for (let i = 0; i < totalBuffer.length; i++) {
          for (let bit = 7; bit >= 0; bit--) {
            const byteIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3);
            const value = (totalBuffer[i] >> bit) & 1;
            
            // Clear LSB and set it to our value
            pixels[byteIndex] = (pixels[byteIndex] & 0xFE) | value;
            bitIndex++;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob(resolve, 'image/png');
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageBlob);
    });
  },

  /**
   * Extracts data from a cloaked carrier image
   */
  async uncloak(imageBlob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Extract length (first 32 bits)
        let length = 0;
        let bitIndex = 0;
        for (let i = 0; i < 32; i++) {
          const byteIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3);
          const bit = pixels[byteIndex] & 1;
          length = (length << 1) | bit;
          bitIndex++;
        }

        if (length <= 0 || length > 10 * 1024 * 1024) { // 10MB sanity check
          return reject(new Error("No valid Ghost Archive detected in this image."));
        }

        const result = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) {
            const byteIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3);
            const bitVal = pixels[byteIndex] & 1;
            byte = (byte << 1) | bitVal;
            bitIndex++;
          }
          result[i] = byte;
        }

        resolve(new TextDecoder().decode(result));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageBlob);
    });
  }
};

if (typeof window !== 'undefined') {
  window.GhostEngine = GhostEngine;
}

module.exports = GhostEngine;
