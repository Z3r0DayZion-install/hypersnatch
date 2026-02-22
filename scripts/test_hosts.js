/**
 * SmartDecode 2.0 - Host Extraction Verification
 * Verifies Emload and Kshared extraction logic.
 */

const SmartDecode = require('../src/core/smartdecode');

const hostSamples = [
    {
        name: "Emload V2 Link",
        input: "Check this out: https://www.emload.com/v2/file/ajRGMlgyUmt0VXNnc01xNzRiZk5Odz09/syrup-series.rar"
    },
    {
        name: "Emload Standard Link",
        input: "<a href='https://emload.com/file/Qld5MkhWNlVBWG1BTmdvQUZBaEs3QT09/video.mp4'>Download</a>"
    },
    {
        name: "Kshared Link",
        input: "Source: https://www.kshared.com/file/abc123def456/movie.mkv"
    },
    {
        name: "Rapidgator Link",
        input: "https://rapidgator.net/file/8b2a3c4d5e6f7g8h9i0j/movie.mp4.html"
    },
    {
        name: "Turbobit Link",
        input: "https://turbobit.net/a1b2c3d4e5f6.html"
    },
    {
        name: "Nitroflare Link",
        input: "https://nitroflare.com/view/ABCDEF123456/archive.zip"
    },
    {
        name: "Mega Link",
        input: "https://mega.nz/file/abc123de#key123"
    },
    {
        name: "Mediafire Link",
        input: "https://www.mediafire.com/file/xyz789/document.pdf"
    },
    {
        name: "Pixeldrain Link",
        input: "https://pixeldrain.com/u/pd12345"
    },
    {
        name: "Hexupload Link",
        input: "https://hexupload.net/hex123"
    },
    {
        name: "Krakenfiles Link",
        input: "https://krakenfiles.com/view/kf123/file.html"
    },
    {
        name: "Filefactory Link",
        input: "https://www.filefactory.com/file/ff123"
    },
    {
        name: "Uploadgig Link",
        input: "https://uploadgig.com/file/ug123"
    },
    {
        name: "Ddownload Link",
        input: "https://ddownload.com/dd123"
    },
    {
        name: "Katfile Link",
        input: "https://katfile.com/kf123"
    },
    {
        name: "Doodstream Link",
        input: "https://dood.to/e/dood123"
    },
    {
        name: "Streamtape Link",
        input: "https://streamtape.com/v/st123"
    },
    {
        name: "Mixdrop Link",
        input: "https://mixdrop.co/e/md123"
    },
    {
        name: "Voe Link",
        input: "https://voe.sx/v123"
    },
    {
        name: "Vidoza Link",
        input: "https://vidoza.net/vz123"
    },
    {
        name: "Gofile Link",
        input: "https://gofile.io/d/gf123"
    },
    {
        name: "1fichier Link",
        input: "https://1fichier.com/?id123"
    },
    {
        name: "Uptobox Link",
        input: "https://uptobox.com/ub123"
    },
    {
        name: "Userscloud Link",
        input: "https://userscloud.com/uc123"
    },
    {
        name: "Upfiles Link",
        input: "https://upfiles.com/uf123"
    },
    {
        name: "Userload Link",
        input: "https://userload.co/f/ul123"
    },
    {
        name: "Vudeo Link",
        input: "https://vudeo.net/v123.html"
    },
    {
        name: "Vidmoly Link",
        input: "https://vidmoly.to/vm123"
    },
    {
        name: "Upstream Link",
        input: "https://upstream.to/us123"
    },
    {
        name: "LuluStream Link",
        input: "https://lulustream.com/e/ls123"
    },
    {
        name: "Vidlox Link",
        input: "https://vidlox.me/vl123"
    },
    {
        name: "Streamwish Link",
        input: "https://streamwish.to/sw123"
    },
    {
        name: "Filelion Link",
        input: "https://filelion.live/v/fl123"
    },
    {
        name: "Vidguard Link",
        input: "https://vidguard.to/v/vg123"
    },
    {
        name: "Faststream Link",
        input: "https://faststream.pw/v/fs123"
    },
    {
        name: "VTube Link",
        input: "https://vtube.to/vt123"
    },
    {
        name: "VeeStream Link",
        input: "https://veestream.to/v/vs123"
    },
    {
        name: "Rosefile Link",
        input: "https://rosefile.net/rf123"
    },
    {
        name: "Daofile Link",
        input: "https://daofile.com/df123"
    },
    {
        name: "Filespace Link",
        input: "https://filespace.com/fs456"
    },
    {
        name: "Hotlink Link",
        input: "https://hotlink.cc/hl123"
    }
];

console.log("🔍 SmartDecode 2.0 - Host Extraction Verification");
console.log("================================================");

let allPassed = true;

hostSamples.forEach(sample => {
    console.log(`\n📂 Scenario: ${sample.name}`);
    const result = SmartDecode.run(sample.input);
    const hostCandidates = result.extractionMap.hosts || [];

    if (hostCandidates.length > 0) {
        console.log(`✅ Extracted ${hostCandidates.length} host candidates:`);
        hostCandidates.forEach(c => {
            console.log(`   - [${c.host}] URL: ${c.url}`);
            console.log(`     FileID: ${c.fileId} | Filename: ${c.filename}`);
        });
    } else {
        console.log("❌ FAILED: No host candidates extracted.");
        allPassed = false;
    }
});

console.log("\n================================================");
if (allPassed) {
    console.log("🎉 ALL HOST EXTRACTION VERIFICATIONS PASSED!");
    process.exit(0);
} else {
    console.log("💥 SOME HOST EXTRACTION VERIFICATIONS FAILED!");
    process.exit(1);
}
