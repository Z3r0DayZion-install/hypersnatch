"use strict";

require("../utils/crash-logger").initCrashHandler();


const http = require("http");
const SmartDecode = require("../core/smartdecode/index");
const DownloadPlan = require("../core/download-plan");

const PORT = 4179;
const HOST = "127.0.0.1";
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB limit

const server = http.createServer(async (req, res) => {
    // CORS Headers for local UI
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    if (req.url === "/health" && req.method === "GET") {
        let ver = "1.0.0";
        try {
            ver = require("../../VERSION.json").version;
        } catch (e) { }
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ status: "ok", version: ver }));
    }

    if (req.url === "/decode" && req.method === "POST") {
        const providedToken = req.headers["x-hypersnatch-token"];
        if (!providedToken || providedToken !== global.BRIDGE_TOKEN) {
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Unauthorized: Invalid or missing X-HyperSnatch-Token." }));
        }

        let body = "";
        let size = 0;

        req.on("data", chunk => {
            size += chunk.length;
            if (size > MAX_PAYLOAD_SIZE) {
                req.destroy(new Error("Payload Too Large"));
            } else {
                body += chunk;
            }
        });

        req.on("end", async () => {
            try {
                const data = JSON.parse(body);
                const input = typeof data.input === "string" ? data.input : "";
                const pickIndex = typeof data.pickIndex === "number" ? data.pickIndex : null;

                if (!input) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Empty input" }));
                }

                const results = await SmartDecode.run(input);

                // Sort deterministically to match CLI
                const sortedCandidates = [...results.candidates].sort((a, b) => a.url.localeCompare(b.url));
                const sortedRefusals = [...results.refusals].sort((a, b) => (a.host + a.reason).localeCompare(b.host + b.reason));

                let selectedCandidate = null;
                if (pickIndex !== null && sortedCandidates[pickIndex]) {
                    selectedCandidate = sortedCandidates[pickIndex];
                } else {
                    selectedCandidate = results.best || (sortedCandidates.length > 0 ? sortedCandidates[0] : null);
                }

                let plan = null;
                if (selectedCandidate) {
                    plan = DownloadPlan.generate(selectedCandidate);
                }

                const output = {
                    version: results.version,
                    candidates: sortedCandidates.map(c => ({
                        host: c.host || "unknown",
                        type: c.type || "unknown",
                        confidence: typeof c.confidence === "number" ? c.confidence : 0,
                        status: c.status || "unknown",
                        url: c.url || ""
                    })),
                    refusals: sortedRefusals.map(r => ({
                        host: r.host || "unknown",
                        reason: r.reason || "unknown",
                        markers: Array.isArray(r.markers) ? r.markers : []
                    })),
                    best: selectedCandidate ? {
                        host: selectedCandidate.host || "unknown",
                        type: selectedCandidate.type || "unknown",
                        confidence: typeof selectedCandidate.confidence === "number" ? selectedCandidate.confidence : 0,
                        status: selectedCandidate.status || "unknown",
                        url: selectedCandidate.url || ""
                    } : null,
                    downloadPlan: plan || null
                };

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(output));

            } catch (err) {
                console.error("Bridge extraction error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message || "Internal Bridge Error" }));
            }
        });
    } else { // This else block handles all other non-/health, non-/decode requests
        res.writeHead(404);
        return res.end("Not Found");
    }


});

let currentPort = PORT;

server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
        console.warn(`⚠️ Port ${currentPort} in use, trying ${currentPort + 1}...`);
        currentPort++;
        if (currentPort > 4190) {
            console.error("❌ Max port attempts reached (4179-4190).");
            process.exit(1);
        }
        setTimeout(() => {
            server.close();
            server.listen(currentPort, HOST);
        }, 100);
    } else {
        console.error("Server error:", e);
    }
});

server.listen(currentPort, HOST, () => {
    console.log(`🚀 HyperSnatch UI Bridge listening at http://${HOST}:${currentPort}`);
    console.log(`Open ui/hypersnatch-ui.html in your browser!`);

    try {
        const fs = require('fs');
        const path = require('path');
        const crypto = require('crypto');
        let ver = "1.0.0";
        try { ver = require("../../VERSION.json").version; } catch (e) { }
        const isPackaged = process.pkg || process.execPath.endsWith("ui-bridge.exe");
        const exeDir = isPackaged ? path.dirname(process.execPath) : process.cwd();
        const runtimePath = path.join(exeDir, "bridge.runtime.json");
        const token = crypto.randomBytes(32).toString('hex');

        // Expose token globally for request validation
        global.BRIDGE_TOKEN = token;

        fs.writeFileSync(runtimePath, JSON.stringify({
            chosenPort: currentPort,
            pid: process.pid,
            version: ver,
            token: token
        }), 'utf8');

        // Clean up on exit
        process.on('exit', () => { try { fs.unlinkSync(runtimePath); } catch (e) { } });
        process.on('SIGINT', () => process.exit(0));
        process.on('SIGTERM', () => process.exit(0));
    } catch (err) {
        console.error("Failed to write bridge.runtime.json", err);
    }
});
