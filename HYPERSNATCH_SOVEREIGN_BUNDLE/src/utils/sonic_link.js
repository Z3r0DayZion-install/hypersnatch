// ==================== SONIC LINK // HIVE MESH PROTOCOL ====================
"use strict";

const SonicLink = {
  // FSK (Frequency Shift Keying) Configuration
  FREQ_BASE: 18000, // Near-ultrasonic base frequency
  FREQ_STEP: 200,   // Frequency step for bits
  BIT_DURATION: 0.1, // Seconds per bit

  ctx: null,
  
  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  /**
   * Encodes a string into audio pulses
   */
  async transmit(data) {
    if (!this.ctx) this.init();
    const bytes = new TextEncoder().encode(data);
    const now = this.ctx.currentTime;
    
    let time = now + 0.5;
    
    // Transmit preamble
    this.playTone(this.FREQ_BASE, time, 0.2);
    time += 0.3;

    for (const byte of bytes) {
      for (let i = 0; i < 8; i++) {
        const bit = (byte >> (7 - i)) & 1;
        const freq = this.FREQ_BASE + (bit + 1) * this.FREQ_STEP;
        this.playTone(freq, time, this.BIT_DURATION);
        time += this.BIT_DURATION;
      }
    }
    
    console.log(`[SonicLink] Transmitting ${bytes.length} bytes...`);
  },

  playTone(freq, start, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.01);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(start);
    osc.stop(start + duration);
  },

  /**
   * Activates the listener for Sonic data (Placeholder for full FFT logic)
   */
  listen() {
    console.log("[SonicLink] Hive Listener Active. Tuning to near-ultrasonic frequencies...");
    // In a full implementation, we use an AnalyserNode + FFT to detect bit frequencies
    return true;
  }
};

if (typeof window !== 'undefined') window.SonicLink = SonicLink;
module.exports = SonicLink;
