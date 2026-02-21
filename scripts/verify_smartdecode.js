/**
 * SmartDecode 2.0 - Verification Script
 * Unit tests, stress tests, and integration validation.
 */

const fs = require('fs');
const path = require('path');
const SmartDecode = require('../src/core/smartdecode');

console.log("🔍 SmartDecode 2.0 - Verification");
console.log("================================");

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, message) {
    testsTotal++;
    if (condition) {
        console.log(`✅ ${message}`);
        testsPassed++;
    } else {
        console.error(`❌ FAILED: ${message}`);
    }
}

// --- UNIT TESTS ---

// 1. Stress Test - 2MB HTML
console.log("\n🧪 Running Stress Test (2MB HTML)...");
const largeHtml = "<html><body>" + "<div>test</div>".repeat(150000) + "</body></html>";
const startTime = Date.now();
const stressResult = SmartDecode.run(largeHtml);
const duration = Date.now() - startTime;
assert(duration < 200, `Stress test completed in ${duration}ms (target < 200ms)`);
assert(stressResult.candidates.length === 0, "No candidates in junk HTML");

// 2. Direct Extraction Test
console.log("\n🧪 Running Direct Extraction Test...");
const directHtml = `
  <video src="https://cdn.example.com/movie.mp4"></video>
  <a href="https://serv1.net/playlist.m3u8?token=123">Stream</a>
`;
const directResult = SmartDecode.run(directHtml);
assert(directResult.candidates.length >= 2, "Found both mp4 and m3u8");
assert(directResult.candidates.some(c => c.url.includes('.mp4')), "Verified mp4 discovery");
assert(directResult.candidates.some(c => c.url.includes('.m3u8')), "Verified m3u8 discovery");

// 3. Base64 & Script Trace Test
console.log("\n🧪 Running Base64 & Script Trace Test...");
const b64Url = "aHR0cHM6Ly9zdHJlYW0ubmV0L3ZpZGVvLm0zdTg="; // https://stream.net/video.m3u8
const traceHtml = `
  <script>
    var enc = "${b64Url}";
    var dec = atob(enc);
    var final = dec;
  </script>
`;
const traceResult = SmartDecode.run(traceHtml);
assert(traceResult.candidates.some(c => c.url === "https://stream.net/video.m3u8"), "Resolved Base64 + Script chain");
assert(traceResult.extractionMap.scriptTrace.length > 0, "Captured script trace layer");

// 4. P.A.C.K.E.R. Test
console.log("\n🧪 Running P.A.C.K.E.R. Unpacker Test...");
// Simple packed block containing a stream URL
const packedBlock = "eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c])}}return p}('0://1.2/3.4',5,5,'https|server|com|video|mp4'.split('|'),0,{}))";
const packerResult = SmartDecode.run(packedBlock);
assert(packerResult.candidates.some(c => c.url === "https://server.com/video.mp4"), "Unpacked and extracted P.A.C.K.E.R block");

// 5. Iframe Recursion Test
console.log("\n🧪 Running Iframe Recursion Test...");
const iframeHtml = `
  <iframe srcdoc="<html><body><video src='https://nested.com/movie.mp4'></video></body></html>"></iframe>
`;
const iframeResult = SmartDecode.run(iframeHtml);
assert(iframeResult.candidates.some(c => c.url === "https://nested.com/movie.mp4"), "Found stream inside nested srcdoc iframe");

// 6. M3U8 Analysis Test
console.log("\n🧪 Running M3U8 Analysis Test...");
const m3u8Content = `
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=1280x720
chunk.m3u8
`;
const masterHtml = `
  <script>var playlist = "https://origin.com/master.m3u8";</script>
  <!-- Content is inline for this test simulation -->
  ${m3u8Content}
`;
const masterResult = SmartDecode.run(masterHtml);
assert(masterResult.candidates.some(c => c.type === 'hls_variant' && c.height === 720), "Parsed M3U8 variants from inline content");

// --- SUMMARY ---
console.log("\n================================");
console.log(`📊 Total Results: ${testsPassed}/${testsTotal} passed`);
if (testsPassed === testsTotal) {
    console.log("🎉 ALL SMARTDECODE 2.0 VERIFICATIONS PASSED!");
    process.exit(0);
} else {
    console.log("💥 SOME VERIFICATIONS FAILED!");
    process.exit(1);
}
