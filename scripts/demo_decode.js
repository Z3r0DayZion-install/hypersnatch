/**
 * SmartDecode 2.0 - Concrete Feature Demonstration
 * Demonstrates Link Decoding (Base64), P.A.C.K.E.R analysis, and Script Tracing.
 */

const SmartDecode = require('../src/core/smartdecode');

const samples = [
    {
        name: "Base64 Encoded Stream",
        input: `<div>Watch now: <span id="link">aHR0cHM6Ly9zdHJlYW0ubmV0L3BsYXlsaXN0Lm0zdTg=</span></div>
                <script>var x = document.getElementById("link").innerText; var decoded = atob(x);</script>`
    },
    {
        name: "P.A.C.K.E.R. Obfuscated Script",
        input: `eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c])}}return p}('0://1.2/3.4',5,5,'https|protected-cdn|io|movie|mp4'.split('|'),0,{}))`
    },
    {
        name: "Nested Iframe with Hidden Source",
        input: `<iframe srcdoc="<html><body><video src='https://hidden-stream.com/chunk.m3u8'></video></body></html>"></iframe>`
    },
    {
        name: "M3U8 Master Playlist Analysis",
        input: `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=1280x720
https://edge.io/720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2560000,RESOLUTION=1920x1080
https://edge.io/1080p.m3u8`
    }
];

console.log("🚀 SmartDecode 2.0 - Feature Demonstration");
console.log("==========================================");

samples.forEach(sample => {
    console.log(`\n📂 Scenario: ${sample.name}`);
    console.log("------------------------------------------");

    const startTime = Date.now();
    const result = SmartDecode.run(sample.input);
    const duration = Date.now() - startTime;

    if (result.candidates.length > 0) {
        console.log(`✅ Extracted ${result.candidates.length} candidates in ${duration}ms`);
        result.candidates.forEach((c, idx) => {
            console.log(`   [${idx + 1}] URL: ${c.url}`);
            console.log(`       Type: ${c.type} | Score: ${c.finalScore || 'N/A'}`);
            if (c.height) console.log(`       Resolution: ${c.width}x${c.height}`);
        });

        if (result.best) {
            console.log(`⭐ Best Match: ${result.best.url}`);
        }
    } else {
        console.log("⚠️ No candidates found.");
    }
});

console.log("\n==========================================");
console.log("✅ Demonstration Complete.");
