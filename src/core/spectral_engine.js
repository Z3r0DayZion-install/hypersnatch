// ==================== SPECTRAL ENGINE // SIGINT RECON ====================
"use strict";

const { exec } = require('child_process');

const SpectralEngine = {
    signals: [],

    /**
     * Scans for local electromagnetic artifacts (Wi-Fi/BT)
     */
    async scan() {
        return new Promise((resolve) => {
            console.log("[SpectralEngine] Sniffing local spectrum...");
            
            // Native Windows Wi-Fi Scan
            exec('netsh wlan show networks mode=bssid', (err, stdout) => {
                if (err) {
                    // Fallback for airgapped/no-adapter environments
                    this.signals = [{ ssid: "GHOST_NET", signal: "99%", bssid: "DE:AD:BE:EF:00:01" }];
                    return resolve(this.signals);
                }

                this.signals = this.parseNetsh(stdout);
                resolve(this.signals);
            });
        });
    },

    parseNetsh(output) {
        const networks = [];
        const lines = output.split('
');
        let current = null;

        lines.forEach(line => {
            if (line.includes('SSID')) {
                if (current) networks.push(current);
                current = { ssid: line.split(':')[1].trim() };
            }
            if (line.includes('Signal') && current) {
                current.signal = line.split(':')[1].trim();
            }
            if (line.includes('BSSID') && current) {
                current.bssid = line.split(':').slice(1).join(':').trim();
            }
        });
        if (current) networks.push(current);
        return networks;
    }
};

if (typeof window !== 'undefined') window.SpectralEngine = SpectralEngine;
module.exports = SpectralEngine;
