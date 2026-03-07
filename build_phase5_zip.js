const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const stagingDir = path.join(__dirname, 'HyperSnatch_Phase5_Staging');
const outDir = path.join(stagingDir, 'HyperSnatch');

// Clean up any old runs
if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
}

// Build exact requested structure
fs.mkdirSync(path.join(outDir, 'src', 'core'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'src', 'forensics'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'ui', 'panels'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'datasets', 'reference_bundle_hls'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'tests_phase5'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'release'), { recursive: true });

// Helpers
const copyFile = (src, dest) => {
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
};
const copyDir = (src, dest) => {
    if (!fs.existsSync(src)) return;
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

// 1. Core Engine
copyFile('src/core/engine_core.js', path.join(outDir, 'src', 'core', 'engine_core.js'));
copyFile('src/core/report_generator.js', path.join(outDir, 'src', 'core', 'report_generator.js'));

// 2. Forensics
copyDir('src/forensics', path.join(outDir, 'src', 'forensics'));

// 3. UI
copyFile('ui/hypersnatch-ui.html', path.join(outDir, 'ui', 'hypersnatch-ui.html'));
if (fs.existsSync('ui/panels')) copyDir('ui/panels', path.join(outDir, 'ui', 'panels'));

// 4. Datasets
copyDir('tests/evidence/target_2_hls', path.join(outDir, 'datasets', 'reference_bundle_hls'));

// 5. Tests
copyDir('tests_phase5', path.join(outDir, 'tests_phase5'));

// 6. Release Manifest
fs.writeFileSync(path.join(outDir, 'release', 'PHASE5_RELEASE_MANIFEST.json'), JSON.stringify({
    version: "1.0.0-phase5",
    description: "Phase 5 Complete Working Bundle - Stream Forensics Engine",
    modules: [
        "parseTimeline",
        "buildStreamLadder",
        "buildWaterfall",
        "detectCDN",
        "detectTokenPatterns"
    ],
    components: [
        "hypersnatch-ui.html"
    ],
    tests: "tests_phase5/"
}, null, 2));

// Zip using Windows tar
try {
    const zipName = 'HyperSnatch_Phase5_WorkingBundle.zip';
    if (fs.existsSync(zipName)) fs.unlinkSync(zipName);
    execSync(`tar -a -c -f ${zipName} -C HyperSnatch_Phase5_Staging HyperSnatch`);
    console.log(`Successfully packaged all components into ${zipName}`);
} catch (e) {
    console.error("Archive creation failed", e.message);
}

// Cleanup
fs.rmSync(stagingDir, { recursive: true, force: true });
