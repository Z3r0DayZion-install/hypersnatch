/**
 * Reconstructs HLS/DASH bitrate ladders from raw manifest file content.
 */
function buildStreamLadder(manifestContent, url) {
    let ladder = {
        protocol: url && url.includes('.mpd') ? 'dash' : 'hls',
        levels: []
    };

    if (!manifestContent) {
        return ladder;
    }

    if (ladder.protocol === 'hls') {
        // Parse M3U8 Master Playlists
        const lines = manifestContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXT-X-STREAM-INF')) {
                let level = { bitrate: 0, resolution: 'Unknown', codecs: '' };

                const bwMatch = line.match(/BANDWIDTH=(\d+)/);
                if (bwMatch) level.bitrate = parseInt(bwMatch[1], 10);

                const resMatch = line.match(/RESOLUTION=(\d+x\d+)/);
                if (resMatch) level.resolution = resMatch[1];

                const codecMatch = line.match(/CODECS="([^"]+)"/);
                if (codecMatch) level.codecs = codecMatch[1];

                // Track the segment URL underneath the tag
                if (i + 1 < lines.length && !lines[i + 1].startsWith('#')) {
                    level.url = lines[i + 1].trim();
                }

                ladder.levels.push(level);
            }
        }
    } else {
        // Basic DASH MPD parse (XML Regex fallback)
        const repRegex = /<Representation[^>]+>/g;
        let match;
        while ((match = repRegex.exec(manifestContent)) !== null) {
            let level = { bitrate: 0, resolution: 'Unknown', codecs: '' };
            const m = match[0];

            const bwMatch = m.match(/bandwidth="(\d+)"/);
            if (bwMatch) level.bitrate = parseInt(bwMatch[1], 10);

            const wMatch = m.match(/width="(\d+)"/);
            const hMatch = m.match(/height="(\d+)"/);
            if (wMatch && hMatch) level.resolution = `${wMatch[1]}x${hMatch[1]}`;

            const codecMatch = m.match(/codecs="([^"]+)"/);
            if (codecMatch) level.codecs = codecMatch[1];

            ladder.levels.push(level);
        }
    }

    // Sort ladder high to low bitrate
    ladder.levels.sort((a, b) => b.bitrate - a.bitrate);

    return ladder;
}

module.exports = buildStreamLadder;
