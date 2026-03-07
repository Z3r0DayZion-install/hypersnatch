const puppeteer = require('puppeteer');
const path = require('path');

async function renderUI() {
  console.log("Launching Puppeteer directly to local HTML path...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Set viewport to a realistic desktop size
  await page.setViewport({ width: 1400, height: 900 });

  const htmlPath = path.resolve(__dirname, 'ui/hypersnatch-ui.html');
  await page.goto(`file://${htmlPath}`);

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');

  // Simulate clicking the Load Evidence Button directly by mocking the IPC output
  // so we can test the UI in pure Chrome without Electron
  await page.evaluate(() => {
    // Stub the global status and logs to simulate a loaded bundle
    document.getElementById('valGlobalStatus').textContent = "VALID (target_test_001)";
    document.getElementById('valGlobalStatus').className = "status-badge ok";
    document.getElementById('lrSessionPath').textContent = "C:\\Projects\\Evidence\\target_test_001";

    // Mock the Evidence List
    document.getElementById('lrFileList').innerHTML = `
          <div class="val-item ok">har_classified.json</div>
          <div class="val-item ok">player_profile.json</div>
          <div class="val-item ok">stream_candidates.json</div>
          <div class="val-item warn">report.md</div>
          <div class="val-item ok">manifest.json</div>
        `;

    // Mock Summary Tab
    document.getElementById('sumTargetUrl').textContent = "https://example.com/stream.html";
    document.getElementById('sumValidity').textContent = "PASS_WITH_WARNINGS";
    document.getElementById('sumValidity').className = "status-badge warn";
    document.getElementById('sumTopCandidate').textContent = "https://example.com/manifest.m3u8";
    document.getElementById('sumTopScore').textContent = "95";
    document.getElementById('sumTopProtocol').textContent = "HLS";
    document.getElementById('sumPlayerName').textContent = "Bitmovin Player";
    document.getElementById('sumPlayerConfidence').textContent = "Confidence: 0.98";

    // Mock Candidates Table
    document.getElementById('candidatesTbody').innerHTML = `
            <tr>
              <td>[0]</td>
              <td>95</td>
              <td>HLS</td>
              <td class="mono">https://example.com/manifest.m3u8</td>
              <td style="color:var(--color-warn);">Y</td>
              <td style="color:var(--text-muted);">N</td>
              <td style="color:var(--text-muted);">N</td>
            </tr>
            <tr>
              <td>[1]</td>
              <td>80</td>
              <td>HTTP</td>
              <td class="mono">https://example.com/chunk_001.ts</td>
              <td style="color:var(--text-muted);">N</td>
              <td style="color:var(--color-ok);">Y</td>
              <td style="color:var(--text-muted);">N</td>
            </tr>
        `;

    // Mock HAR Network Tab
    document.getElementById('harTbody').innerHTML = `
            <tr>
              <td>GET</td>
              <td style="color:var(--color-ok);">200</td>
              <td>segment</td>
              <td class="mono">https://example.com/chunk_001.ts</td>
            </tr>
            <tr>
              <td>POST</td>
              <td style="color:var(--color-bad);">403</td>
              <td>license</td>
              <td class="mono">https://example.com/drm/widevine</td>
            </tr>
        `;

    // Mock Right Intelligence Panel
    document.getElementById('intPlayer').textContent = "Bitmovin Player";
    document.getElementById('intCdn').textContent = "Mux Video (Detected)";
    document.getElementById('intDrm').innerHTML = '<span class="status-badge warn">Policy Token</span>';
    document.getElementById('intMse').innerHTML = '<span class="status-badge ok">VERIFIED</span>';
    document.getElementById('intHash').textContent = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    // Mock Timeline Panel
    document.getElementById('timelineTbody').innerHTML = `
            <tr>
              <td class="muted">0</td>
              <td><span class="pill tiny mono">MANIFEST</span></td>
              <td>application/x-mpegurl</td>
              <td class="mono" style="font-size:11px; max-width:350px; overflow:hidden; text-overflow:ellipsis;">https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_fhd_7.m3u8</td>
            </tr>
            <tr>
              <td class="muted">1</td>
              <td><span class="pill tiny mono">SEGMENT</span></td>
              <td>video/mp2t</td>
              <td class="mono" style="font-size:11px; max-width:350px; overflow:hidden; text-overflow:ellipsis;">https://test-streams.mux.dev/x36xhzz/url_8/url_591/193039199_mp4_h264_aac_fhd_7.ts</td>
            </tr>
            <tr>
              <td class="muted">2</td>
              <td><span class="pill tiny mono">SEGMENT</span></td>
              <td>video/mp2t</td>
              <td class="mono" style="font-size:11px; max-width:350px; overflow:hidden; text-overflow:ellipsis;">https://test-streams.mux.dev/x36xhzz/url_8/url_590/193039199_mp4_h264_aac_fhd_7.ts</td>
            </tr>
        `;

    // Mock Ladder Panel
    document.getElementById('ladderTbody').innerHTML = `
            <tr>
              <td style="font-weight:600;">1920x1080</td>
              <td class="mono">3000000</td>
              <td class="mono muted">avc1.640028,mp4a.40.2</td>
            </tr>
            <tr>
              <td style="font-weight:600;">1280x720</td>
              <td class="mono">1500000</td>
              <td class="mono muted">avc1.4d401f,mp4a.40.2</td>
            </tr>
            <tr>
              <td style="font-weight:600;">640x360</td>
              <td class="mono">800000</td>
              <td class="mono muted">avc1.42c01e</td>
            </tr>
        `;
    document.getElementById('ladderProtocol').textContent = "HLS";
    document.getElementById('ladderTiers').textContent = "3";

    // Click the Timeline Tab to make it visible for the screenshot
    const timelineBtn = document.querySelector('.tab-btn[data-tab="tabTimeline"]');
    if (timelineBtn) timelineBtn.click();

    // Add a line to the bottom log
    const statusLog = document.getElementById('statusLog');
    const line = document.createElement('div');
    line.style.color = 'var(--text-accent)';
    line.innerText = "[12:00:00 PM] Forensic intelligence arrays generated (Timeline, CDN, Tokens).";
    statusLog.appendChild(line);
  });

  await new Promise(r => setTimeout(r, 1000));

  const artifactPath = path.resolve(__dirname, '..', '.gemini/antigravity/brain/f03109a3-5e70-46b8-a40f-8322a7f8d653/workstation_phase5_preview.webp');
  await page.screenshot({ path: artifactPath, type: 'webp', quality: 90 });
  console.log("Saved UI screenshot to: " + artifactPath);

  await browser.close();
}

renderUI().catch(console.error);
