/**
 * PROOF: All 40 Host Decoders — extract() + resurrect()
 * This script tests every single decoder with realistic input and outputs a pass/fail report.
 */
const fs = require('fs');
const path = require('path');

const hostsDir = path.join(__dirname, '..', 'src', 'core', 'smartdecode', 'hosts');
const files = fs.readdirSync(hostsDir).filter(f => f.endsWith('.js')).sort();

// Test data for each host
const TEST_DATA = {
    '1fichier': { url: 'https://1fichier.com/?abc123def', html: '<a id="download" href="https://1fichier.com/dl/abc123def/file.zip">Download</a>' },
    'daofile': { url: 'https://daofile.com/xyz789', html: '<a id="download" href="https://daofile.com/dl/xyz789/movie.mp4">Download</a>' },
    'ddownload': { url: 'https://ddownload.com/abc456', html: '<input id="dl" value="https://ddownload.com/dl/abc456/data.rar">' },
    'doodstream': { url: 'https://dood.to/e/abc123', html: '<script>var src = "https://cdn.dood.to/pass_md5/abc123/stream.mp4"; var alt = "https://cdn.dood.to/direct/abc123.mp4";</script>' },
    'emload': { url: 'https://emload.com/f/abc123def', html: '<script>var stream_url = "https://cdn.emload.com/dl/abc123def/movie.mp4";</script>' },
    'faststream': { url: 'https://faststream.pw/e/abc123', html: '<script>file: "https://cdn.faststream.pw/stream/abc123.m3u8"</script>' },
    'filefactory': { url: 'https://filefactory.com/file/abc123', html: '<a id="download" href="https://filefactory.com/dl/abc123/archive.zip">Download</a>' },
    'filelion': { url: 'https://filelion.live/v/abc123', html: '<script>file: "https://cdn.filelion.online/stream/abc123.m3u8"</script>' },
    'filespace': { url: 'https://filespace.com/abc123', html: '<a id="btn_download" href="https://filespace.com/dl/abc123/data.zip">Get</a>' },
    'gofile': { url: 'https://gofile.io/d/abc123', html: '<script>var contentId = "abc123"; var directLink = "https://store1.gofile.io/download/abc123/file.zip";</script>' },
    'hexupload': { url: 'https://hexupload.net/abc123', html: '<form action="https://hexupload.net/dl/abc123/file.rar"><button>Download</button></form>' },
    'hotlink': { url: 'https://hotlink.cc/abc123', html: '<script>download_url: "https://cdn.hotlink.cc/idl/abc123/stream.mp4";</script>' },
    'katfile': { url: 'https://katfile.com/abc123', html: '<a id="download" href="https://katfile.com/dl/abc123/data.zip">Download</a>' },
    'krakenfiles': { url: 'https://krakenfiles.com/view/abc123/file.html', html: '<a id="download" href="https://krakenfiles.com/dl/abc123/archive.zip">Download</a>' },
    'kshared': { url: 'https://kshared.com/f/abc123', html: '<script>var file_link = "https://cdn.kshared.com/dl/abc123/video.mp4";</script>' },
    'lulustream': { url: 'https://lulustream.com/e/abc123', html: '<source src="https://cdn.lulustream.com/stream/abc123.m3u8">' },
    'mediafire': { url: 'https://mediafire.com/file/abc123/movie.mp4', html: '<a id="downloadButton" href="https://download1.mediafire.com/abc123/movie.mp4">Download</a>' },
    'mega': { url: 'https://mega.nz/file/abc123#key456', html: '<title>MEGA File</title>' },
    'mixdrop': { url: 'https://mixdrop.co/e/abc123', html: '<script>MDCore.wurl = "https://s-delivery.mixdrop.co/v/abc123/src/abc123.mp4";</script>' },
    'nitroflare': { url: 'https://nitroflare.com/view/abc123/data.rar', html: '<a id="download" href="https://nitroflare.com/dl/abc123/data.rar">Download</a>' },
    'pixeldrain': { url: 'https://pixeldrain.com/u/abc123', html: '<script>var viewerData = "https://pixeldrain.com/api/file/abc123";</script>' },
    'rapidgator': { url: 'https://rapidgator.net/file/abc123/data.zip', html: '<a href="https://rapidgator.net/download/abc123">Download</a>' },
    'rosefile': { url: 'https://rosefile.net/abc123', html: '<a id="download" href="https://rosefile.net/dl/abc123/file.zip">Download</a>' },
    'streamtape': { url: 'https://streamtape.com/e/abc123', html: '<script>document.getElementById("videolink").innerHTML = "https://streamtape.com/get_video?token=abc123";</script>' },
    'streamwish': { url: 'https://streamwish.to/e/abc123', html: '<script>file: "https://swcdn.streamwish.to/stream/abc123.m3u8"</script>' },
    'turbobit': { url: 'https://turbobit.net/abc123.html', html: '<a class="download-btn" href="https://turbobit.net/download/abc123/file.zip">Download</a>' },
    'upfiles': { url: 'https://upfiles.com/abc123', html: '<a id="btn_download" href="https://upfiles.com/dl/abc123/data.rar">Get</a>' },
    'uploadgig': { url: 'https://uploadgig.com/file/download/abc123', html: '<a id="download" href="https://uploadgig.com/dl/abc123/archive.zip">Download</a>' },
    'upstream': { url: 'https://upstream.to/e/abc123', html: '<script>src: "https://cdn.upstream.to/stream/abc123.m3u8"</script>' },
    'uptobox': { url: 'https://uptobox.com/abc123', html: '<a id="download" href="https://uptobox.com/dl/abc123/file.zip">Download</a>' },
    'userload': { url: 'https://userload.co/f/abc123', html: '<a id="download" href="https://userload.co/dl/abc123/video.mp4">Download</a>' },
    'userscloud': { url: 'https://userscloud.com/abc123', html: '<form action="https://userscloud.com/dl/abc123/data.zip"><button>Download</button></form>' },
    'veestream': { url: 'https://veestream.to/e/abc123', html: '<script>file: "https://cdn.veestream.to/hls/abc123/master.m3u8";</script>' },
    'vidguard': { url: 'https://vidguard.to/e/abc123', html: '<script>source: "https://cdn.vidguard.to/stream/abc123.m3u8"</script>' },
    'vidlox': { url: 'https://vidlox.me/embed-abc123', html: '<script>file: "https://vidlox.me/cdn/abc123.m3u8";</script>' },
    'vidmoly': { url: 'https://vidmoly.to/embed-abc123', html: '<script>file: "https://vidmoly.to/cdn/abc123.m3u8"</script>' },
    'vidoza': { url: 'https://vidoza.net/e/abc123', html: '<script>src: "https://vidoza.net/v/abc123.mp4";</script>' },
    'voe': { url: 'https://voe.sx/e/abc123', html: '<script>var mp4_url = "https://delivery.voe.sx/abc123.mp4";</script>' },
    'vtube': { url: 'https://vtube.to/embed-abc123', html: '<script>file: "https://vtube.to/cdn/abc123.m3u8"</script>' },
    'vudeo': { url: 'https://vudeo.net/embed-abc123.html', html: '<script>sources:[{file:"https://vudeo.co/cdn/abc123.mp4"}]</script>' }
};

let totalPass = 0;
let totalFail = 0;
const results = [];

console.log('═'.repeat(70));
console.log('  HYPERSNATCH HOST DECODER PROOF — ALL 40 DECODERS');
console.log('═'.repeat(70));
console.log();

for (const file of files) {
    const hostName = file.replace('.js', '');
    const mod = require(path.join(hostsDir, file));
    const testData = TEST_DATA[hostName];

    if (!testData) {
        results.push({ host: hostName, extract: 'SKIP', resurrect: 'SKIP', reason: 'No test data' });
        continue;
    }

    // Test extract()
    let extractOk = false;
    let extractCount = 0;
    try {
        const extracted = mod.extract(testData.url);
        extractOk = Array.isArray(extracted) && extracted.length > 0;
        extractCount = extracted.length;
    } catch (e) {
        extractOk = false;
    }

    // Test resurrect()
    let resurrectOk = false;
    let resurrectCount = 0;
    let resurrectUrls = [];
    try {
        if (typeof mod.resurrect === 'function') {
            const extracted = mod.extract(testData.url);
            const candidate = extracted[0] || { fileId: 'abc123', filename: 'test.mp4', key: 'key456' };
            const resurrected = mod.resurrect(testData.html, candidate);
            resurrectOk = Array.isArray(resurrected) && resurrected.length > 0;
            resurrectCount = resurrected.length;
            resurrectUrls = resurrected.map(r => r.url).slice(0, 2);
        } else {
            resurrectOk = false;
        }
    } catch (e) {
        resurrectOk = false;
    }

    const icon = extractOk && resurrectOk ? '✅' : (extractOk ? '⚠️' : '❌');
    if (extractOk && resurrectOk) totalPass++;
    else totalFail++;

    results.push({
        host: hostName,
        extract: extractOk ? `PASS (${extractCount})` : 'FAIL',
        resurrect: resurrectOk ? `PASS (${resurrectCount} URLs)` : (typeof mod.resurrect === 'function' ? 'FAIL (0 matches)' : 'MISSING'),
        icon,
        urls: resurrectUrls
    });
}

// Print results table
console.log('HOST'.padEnd(16) + 'EXTRACT'.padEnd(14) + 'RESURRECT'.padEnd(20) + 'FIRST RESURRECTED URL');
console.log('─'.repeat(70));

for (const r of results) {
    const icon = r.icon || '  ';
    const urlSample = r.urls && r.urls.length > 0 ? r.urls[0].substring(0, 40) + '...' : '';
    console.log(`${icon} ${r.host.padEnd(14)} ${r.extract.padEnd(14)} ${r.resurrect.padEnd(20)} ${urlSample}`);
}

console.log();
console.log('═'.repeat(70));
console.log(`  RESULTS: ${totalPass} FULL PASS | ${totalFail} PARTIAL/FAIL | ${files.length} TOTAL`);
console.log('═'.repeat(70));
