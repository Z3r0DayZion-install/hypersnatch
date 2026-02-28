/**
 * Batch upgrade script: adds resurrect() methods to all stub decoders
 * Run: node scripts/upgrade_stubs.js
 */
const fs = require('fs');
const path = require('path');

const hostsDir = path.join(__dirname, '..', 'src', 'core', 'smartdecode', 'hosts');

// Decoders that already have resurrect()
const ALREADY_FULL = new Set([
    'doodstream', 'emload', 'gofile', 'hotlink', 'kshared', 'mixdrop',
    'rapidgator', 'streamtape', 'veestream', 'vidoza', 'voe', 'vudeo',
    'mediafire', 'pixeldrain', 'streamwish', 'filelion'
]);

// Video streaming hosts — need jwplayer/m3u8/mp4 patterns
const VIDEO_HOSTS = new Set([
    'faststream', 'lulustream', 'upstream', 'vidguard', 'vidlox', 'vidmoly', 'vtube'
]);

// Special cases
const MEGA = 'mega';

function generateFileHostResurrect(hostName, hostDomain) {
    return `
    /**
     * Resurrect direct download links from ${hostDomain} page source
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, filename } = hostCandidate;

        const domPatterns = [
            // Common download button patterns
            /(?:id=["'](?:download|btn_download|dl_btn)["'][^>]*href=["'](https?:\\/\\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\\/\\/[^"']+)["'][^>]*id=["'](?:download|btn_download|dl_btn)["'])/gi,
            // Direct download CDN links
            /(?:href=["'](https?:\\/\\/(?:[a-z0-9]+\\.)?${hostDomain.replace(/\./g, '\\\\.')}[^"']*\\/dl\\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\\/\\/(?:[a-z0-9]+\\.)?${hostDomain.replace(/\./g, '\\\\.')}[^"']*\\/download\\/[^"']+)["'])/gi,
            // JS variable assignment for download URL
            /(?:var|const|let)\\s+(?:download_url|file_url|direct_url|dl_link)\\s*=\\s*["'](https?:\\/\\/[^"']+)["']/gi,
            // Hidden inputs with download URLs
            /<input[^>]+(?:id|name)=["'](?:dl|download|direct)[^"']*["'][^>]*value=["'](https?:\\/\\/[^"']+)["']/gi,
            // Generic form action for downloads
            /<form[^>]+action=["'](https?:\\/\\/[^"']+\\/(?:dl|download|get)\\/[^"']+)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, filename: filename || 'unknown', fileId,
                        host: '${hostDomain}',
                        type: 'file',
                        sourceLayer: 'resurrection_${hostName}_dom',
                        confidence: 0.92
                    });
                }
            }
        });

        return directCandidates;
    }`;
}

function generateVideoHostResurrect(hostName, hostDomain) {
    return `
    /**
     * Resurrect direct stream links from ${hostDomain} page source
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        const domPatterns = [
            // jwplayer / video.js source configs
            /(?:file|src|source)\\s*[:=]\\s*["'](https?:\\/\\/[^"']+\\.m3u8[^"']*)["']/gi,
            /(?:file|src|source)\\s*[:=]\\s*["'](https?:\\/\\/[^"']+\\.mp4[^"']*)["']/gi,
            // HTML5 video source tags
            /<source\\s+[^>]*src=["'](https?:\\/\\/[^"']+)["']/gi,
            /<video\\s+[^>]*src=["'](https?:\\/\\/[^"']+)["']/gi,
            // Packed/obfuscated player URLs
            /(?:sources|playlist)\\s*[:=]\\s*\\[\\s*\\{[^}]*["'](?:file|src)["']\\s*:\\s*["'](https?:\\/\\/[^"']+)["']/gi,
            // Direct CDN stream URLs
            /["'](https?:\\/\\/[a-z0-9]+\\.(?:${hostDomain.replace(/\./g, '\\\\.')})[^"']+\\.(?:m3u8|mp4)[^"']*)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, fileId,
                        host: '${hostDomain}',
                        type: 'video',
                        sourceLayer: 'resurrection_${hostName}_dom',
                        confidence: 0.94
                    });
                }
            }
        });

        return directCandidates;
    }`;
}

function generateMegaResurrect() {
    return `
    /**
     * Resurrect info from Mega page source (note: Mega uses client-side decryption)
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, key } = hostCandidate;

        // Mega stores file metadata in the page
        const domPatterns = [
            // File name from page title or meta
            /<title>([^<]+)<\\/title>/i,
            // Download manager data
            /(?:var|const|let)\\s+(?:dl_url|mega_url)\\s*=\\s*["'](https?:\\/\\/[^"']+)["']/gi,
            // API responses embedded in page
            /["'](?:g|p)["']\\s*:\\s*["'](https?:\\/\\/[^"']+)["']/gi,
            // Size info
            /"s"\\s*:\\s*(\\d+)/i
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (url.startsWith('http') && !directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, fileId, key,
                        host: 'mega.nz',
                        type: 'file',
                        sourceLayer: 'resurrection_mega_dom',
                        confidence: 0.88
                    });
                }
            }
        });

        // Reconstruct the canonical download page URL
        if (fileId && key) {
            directCandidates.push({
                url: \`https://mega.nz/file/\${fileId}#\${key}\`,
                fileId, key,
                host: 'mega.nz',
                type: 'file',
                sourceLayer: 'resurrection_mega_canonical',
                confidence: 0.99,
                note: 'Mega uses client-side AES decryption — direct CDN download requires MEGAcmd or similar'
            });
        }

        return directCandidates;
    }`;
}

// Host metadata mapping
const HOST_META = {
    '1fichier': { domain: '1fichier.com', type: 'file' },
    'daofile': { domain: 'daofile.com', type: 'file' },
    'ddownload': { domain: 'ddownload.com', type: 'file' },
    'faststream': { domain: 'faststream.pw', type: 'video' },
    'filefactory': { domain: 'filefactory.com', type: 'file' },
    'filespace': { domain: 'filespace.com', type: 'file' },
    'hexupload': { domain: 'hexupload.net', type: 'file' },
    'katfile': { domain: 'katfile.com', type: 'file' },
    'krakenfiles': { domain: 'krakenfiles.com', type: 'file' },
    'lulustream': { domain: 'lulustream.com', type: 'video' },
    'mega': { domain: 'mega.nz', type: 'file' },
    'nitroflare': { domain: 'nitroflare.com', type: 'file' },
    'rosefile': { domain: 'rosefile.net', type: 'file' },
    'turbobit': { domain: 'turbobit.net', type: 'file' },
    'upfiles': { domain: 'upfiles.com', type: 'file' },
    'uploadgig': { domain: 'uploadgig.com', type: 'file' },
    'upstream': { domain: 'upstream.to', type: 'video' },
    'uptobox': { domain: 'uptobox.com', type: 'file' },
    'userload': { domain: 'userload.co', type: 'file' },
    'userscloud': { domain: 'userscloud.com', type: 'file' },
    'vidguard': { domain: 'vidguard.to', type: 'video' },
    'vidlox': { domain: 'vidlox.me', type: 'video' },
    'vidmoly': { domain: 'vidmoly.to', type: 'video' },
    'vtube': { domain: 'vtube.to', type: 'video' }
};

let upgraded = 0;
let skipped = 0;

for (const [hostName, meta] of Object.entries(HOST_META)) {
    if (ALREADY_FULL.has(hostName)) {
        skipped++;
        continue;
    }

    const filePath = path.join(hostsDir, `${hostName}.js`);
    if (!fs.existsSync(filePath)) {
        console.log(`[SKIP] ${hostName}.js not found`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has resurrect
    if (content.includes('resurrect')) {
        console.log(`[SKIP] ${hostName}.js already has resurrect()`);
        skipped++;
        continue;
    }

    // Generate the right resurrect method
    let resurrectCode;
    if (hostName === MEGA) {
        resurrectCode = generateMegaResurrect();
    } else if (VIDEO_HOSTS.has(hostName) || meta.type === 'video') {
        resurrectCode = generateVideoHostResurrect(hostName, meta.domain);
    } else {
        resurrectCode = generateFileHostResurrect(hostName, meta.domain);
    }

    // Insert resurrect() before the closing of the extractor object
    // Pattern: find the last "    }\n};" and insert before the "};"
    // The stubs end with:  "    }\n};\n"
    const closingPattern = /(\s+return Array\.from\(candidates\.values\(\)\);\s+\})\s*\};\s*$/m;

    if (closingPattern.test(content)) {
        content = content.replace(closingPattern, `$1,\n${resurrectCode}\n};\n`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[UPGRADED] ${hostName}.js → added resurrect() for ${meta.domain}`);
        upgraded++;
    } else {
        console.log(`[ERROR] ${hostName}.js — could not find insertion point`);
    }
}

console.log(`\nDone: ${upgraded} upgraded, ${skipped} skipped`);
