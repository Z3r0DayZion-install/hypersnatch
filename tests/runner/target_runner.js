"use strict";

const CDP = require('chrome-remote-interface');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * HyperSnatch Target Runner
 * Uses chrome-remote-interface (CDP) to load a target URL,
 * intercept network requests, execute player heuristic scripts,
 * and dump a DOM snapshot for the EngineCore.
 */
class TargetRunner {
    constructor() {
        this.networkLogs = [];
        this.domSnapshot = "";
        this.client = null;
        this.chromeProcess = null;
    }

    async startChrome() {
        // Look for common paths for Chrome/Edge on Windows
        const browserPaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        ];

        let selectedBrowser = null;
        for (const p of browserPaths) {
            if (fs.existsSync(p)) {
                selectedBrowser = p;
                break;
            }
        }

        if (!selectedBrowser) throw new Error("No Chrome/Edge installation found.");

        this.chromeProcess = spawn(selectedBrowser, [
            '--headless=new',
            '--remote-debugging-port=9222',
            '--disable-gpu',
            '--mute-audio'
        ]);

        // Wait a second for it to spin up
        await new Promise(r => setTimeout(r, 2000));
    }

    async capture(url) {
        if (!this.chromeProcess) await this.startChrome();

        try {
            console.log(`[TargetRunner] Attaching to CDP -> ${url}`);
            this.client = await CDP({ port: 9222 });
            const { Page, Network, Runtime, DOM } = this.client;

            this.networkLogs = [];
            Network.requestWillBeSent((params) => {
                this.networkLogs.push(params.request);
            });

            await Network.enable();
            await Page.enable();
            await DOM.enable();

            // Inject Stream Trace Hooks (Fetch, XHR, MSE)
            await Page.addScriptToEvaluateOnNewDocument({
                source: `
                    window.__hyper_trace = [];
                    
                    // MSE Trace & Payload Capture
                    const originalMSE = window.MediaSource;
                    if (originalMSE) {
                        window.__hyper_mse_buffers = [];
                        window.MediaSource = function() {
                            const mseId = 'mse_' + Math.random().toString(36).substr(2, 9);
                            window.__hyper_trace.push({ type: 'MSE', action: 'construct', mseId, timestamp: Date.now() });
                            const mse = new originalMSE();
                            const origAdd = mse.addSourceBuffer;
                            mse.addSourceBuffer = function(mime) {
                                const sbId = 'sb_' + Math.random().toString(36).substr(2, 9);
                                window.__hyper_trace.push({ type: 'MSE', action: 'addSourceBuffer', mseId, sbId, mime, timestamp: Date.now() });
                                const sb = origAdd.apply(this, arguments);
                                const origAppend = sb.appendBuffer;
                                sb.appendBuffer = function(data) {
                                    try {
                                        // data can be ArrayBuffer or ArrayBufferView
                                        const buffer = data.buffer ? data.buffer : data;
                                        const byteLength = buffer.byteLength;
                                        const bytes = new Uint8Array(buffer, data.byteOffset || 0, byteLength);
                                        // Convert to Base64 for safe transport via CDP
                                        let binary = '';
                                        const len = bytes.byteLength;
                                        for (let i = 0; i < len; i++) {
                                            binary += String.fromCharCode(bytes[i]);
                                        }
                                        const b64 = window.btoa(binary);
                                        window.__hyper_mse_buffers.push({
                                            mseId, sbId, mime, byteLength, payload: b64, timestamp: Date.now()
                                        });
                                        window.__hyper_trace.push({ type: 'MSE', action: 'appendBuffer', mseId, sbId, byteLength, timestamp: Date.now() });
                                    } catch(e) {
                                        window.__hyper_trace.push({ type: 'MSE', action: 'appendBuffer_error', error: e.message, timestamp: Date.now() });
                                    }
                                    return origAppend.apply(this, arguments);
                                };
                                return sb;
                            };
                            return mse;
                        };
                        window.MediaSource.isTypeSupported = originalMSE.isTypeSupported;
                    }
                    
                    // Fetch Trace
                    const originalFetch = window.fetch;
                    window.fetch = function() {
                        const url = arguments[0] instanceof Request ? arguments[0].url : arguments[0];
                        window.__hyper_trace.push({ type: 'fetch', url: url ? url.toString() : '', timestamp: Date.now() });
                        return originalFetch.apply(this, arguments);
                    };

                    // XHR Trace
                    const originalOpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(method, url) {
                        window.__hyper_trace.push({ type: 'xhr', method, url: url ? url.toString() : '', timestamp: Date.now() });
                        return originalOpen.apply(this, arguments);
                    };
                `
            });

            console.log(`[TargetRunner] Navigating...`);
            await Page.navigate({ url });

            // Wait for load event OR timeout after 5 seconds (for direct file URLs)
            await Promise.race([
                Page.loadEventFired(),
                new Promise(r => setTimeout(r, 5000))
            ]);

            // Wait extra 2 seconds for players/scripts to init
            await new Promise(r => setTimeout(r, 2000));

            // Capture DOM
            const { root } = await DOM.getDocument({ depth: -1 });
            const { outerHTML } = await DOM.getOuterHTML({ nodeId: root.nodeId });
            this.domSnapshot = outerHTML;

            // Extract window state by injecting our player interface factory payload
            // Simplified injection for tests: just check basic existences
            const evalRes = await Runtime.evaluate({
                expression: `
                    (function() {
                        const players = {};
                        if (window.jwplayer) players.jwplayer = true;
                        if (window.videojs) players.videojs = true;
                        if (window.Hls) players.hlsjs = true;
                        if (window.shaka) players.shaka = true;
                        if (window.dashjs) players.dashjs = true;
                        return { 
                            players,
                            trace: window.__hyper_trace || [],
                            mseBuffers: window.__hyper_mse_buffers || []
                        };
                    })();
                `,
                returnByValue: true
            });

            return {
                url,
                domContext: {
                    url,
                    dom: this.domSnapshot,
                    networkLogs: this.networkLogs,
                    window: evalRes.result.value || { players: {}, trace: [] }
                }
            };
        } catch (err) {
            console.error('[TargetRunner] Capture failed:', err);
            return null;
        } finally {
            if (this.client) {
                await this.client.close();
            }
        }
    }

    async close() {
        if (this.chromeProcess) {
            this.chromeProcess.kill();
        }
    }
}

module.exports = TargetRunner;
