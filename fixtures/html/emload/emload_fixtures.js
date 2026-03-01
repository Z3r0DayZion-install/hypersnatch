/**
 * Emload Fixture Generator — 25 Synthetic HTML Samples
 * Fully offline string fixtures simulating real Emload page patterns.
 * Used by tests/smartdecode.test.js section [10].
 *
 * Each fixture: { id, name, html, expectedUrls, expectedRefusals, description }
 */

"use strict";

const EMLOAD_FIXTURES = [
    // ───────── Single-source patterns ─────────
    {
        id: 1,
        name: "single_video_source",
        description: "Simple <video><source> with direct mp4 on Emload CDN",
        html: `<video><source src="https://cdn.emload.com/stream/abc123.mp4" type="video/mp4"></video>`,
        expectedUrls: ["https://cdn.emload.com/stream/abc123.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 2,
        name: "single_video_src_attr",
        description: "Video tag with src attribute directly",
        html: `<video src="https://cdn.emload.com/dl/video_2.mp4"></video>`,
        expectedUrls: ["https://cdn.emload.com/dl/video_2.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 3,
        name: "js_variable_url",
        description: "MP4 URL buried in a JS variable assignment",
        html: `<script>var file_url = "https://cdn.emload.com/stream/js_var_file.mp4";</script>`,
        expectedUrls: ["https://cdn.emload.com/stream/js_var_file.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 4,
        name: "json_config_file",
        description: "URL inside a JSON config object in a script tag",
        html: `<script>var config = {"file":"https://cdn.emload.com/get/json_conf.mp4","quality":"720p"};</script>`,
        expectedUrls: ["https://cdn.emload.com/get/json_conf.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 5,
        name: "player_setup_call",
        description: "URL passed to jwplayer.setup() call",
        html: `<script>jwplayer("player").setup({file: 'https://cdn.emload.com/vip/player_setup.mp4', width: 720});</script>`,
        expectedUrls: ["https://cdn.emload.com/vip/player_setup.mp4"],
        expectedRefusals: 0,
    },

    // ───────── Multi-source patterns ─────────
    {
        id: 6,
        name: "multi_source_3_qualities",
        description: "Three <source> tags with different qualities, same video",
        html: `<video>
            <source src="https://cdn.emload.com/stream/multi_360p.mp4" type="video/mp4" label="360p">
            <source src="https://cdn.emload.com/stream/multi_720p.mp4" type="video/mp4" label="720p">
            <source src="https://cdn.emload.com/stream/multi_1080p.mp4" type="video/mp4" label="1080p">
        </video>`,
        expectedUrls: [
            "https://cdn.emload.com/stream/multi_360p.mp4",
            "https://cdn.emload.com/stream/multi_720p.mp4",
            "https://cdn.emload.com/stream/multi_1080p.mp4",
        ],
        expectedRefusals: 0,
    },
    {
        id: 7,
        name: "multi_source_mp4_and_m3u8",
        description: "Mixed MP4 + HLS sources",
        html: `<video>
            <source src="https://cdn.emload.com/stream/mixed.mp4" type="video/mp4">
            <source src="https://cdn.emload.com/stream/mixed_master.m3u8" type="application/x-mpegURL">
        </video>`,
        expectedUrls: [
            "https://cdn.emload.com/stream/mixed.mp4",
            "https://cdn.emload.com/stream/mixed_master.m3u8",
        ],
        expectedRefusals: 0,
    },
    {
        id: 8,
        name: "multi_source_5_qualities",
        description: "Five source tags covering 240p to 1080p",
        html: `<video>
            <source src="https://cdn.emload.com/stream/q240.mp4" type="video/mp4">
            <source src="https://cdn.emload.com/stream/q360.mp4" type="video/mp4">
            <source src="https://cdn.emload.com/stream/q480.mp4" type="video/mp4">
            <source src="https://cdn.emload.com/stream/q720.mp4" type="video/mp4">
            <source src="https://cdn.emload.com/stream/q1080.mp4" type="video/mp4">
        </video>`,
        expectedUrls: [
            "https://cdn.emload.com/stream/q240.mp4",
            "https://cdn.emload.com/stream/q360.mp4",
            "https://cdn.emload.com/stream/q480.mp4",
            "https://cdn.emload.com/stream/q720.mp4",
            "https://cdn.emload.com/stream/q1080.mp4",
        ],
        expectedRefusals: 0,
    },

    // ───────── Base64-encoded patterns ─────────
    {
        id: 9,
        name: "base64_encoded_mp4",
        description: "MP4 URL encoded in base64 inside a script tag",
        html: `<script>var enc = "${Buffer.from('https://cdn.emload.com/stream/b64_encoded.mp4').toString('base64')}";</script>`,
        expectedUrls: ["https://cdn.emload.com/stream/b64_encoded.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 10,
        name: "base64_encoded_m3u8",
        description: "M3U8 URL encoded in base64",
        html: `<script>var src = "${Buffer.from('https://cdn.emload.com/stream/encoded.m3u8').toString('base64')}";</script>`,
        expectedUrls: ["https://cdn.emload.com/stream/encoded.m3u8"],
        expectedRefusals: 0,
    },
    {
        id: 11,
        name: "double_base64_with_direct",
        description: "Both a direct URL and a base64-encoded URL on the same page",
        html: `<video src="https://cdn.emload.com/stream/direct_visible.mp4"></video>
        <script>var hidden = "${Buffer.from('https://cdn.emload.com/dl/hidden_b64.mp4').toString('base64')}";</script>`,
        expectedUrls: [
            "https://cdn.emload.com/stream/direct_visible.mp4",
            "https://cdn.emload.com/dl/hidden_b64.mp4",
        ],
        expectedRefusals: 0,
    },

    // ───────── Iframe-nested patterns ─────────
    {
        id: 12,
        name: "iframe_srcdoc_nested",
        description: "MP4 URL inside an iframe srcdoc",
        html: `<iframe srcdoc="&lt;video src=&quot;https://cdn.emload.com/stream/iframe_nested.mp4&quot;&gt;&lt;/video&gt;"></iframe>`,
        expectedUrls: ["https://cdn.emload.com/stream/iframe_nested.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 13,
        name: "iframe_data_uri",
        description: "MP4 URL inside a data:text/html iframe",
        html: `<iframe src="data:text/html;base64,${Buffer.from('<video src="https://cdn.emload.com/stream/data_uri.mp4"></video>').toString('base64')}"></iframe>`,
        expectedUrls: ["https://cdn.emload.com/stream/data_uri.mp4"],
        expectedRefusals: 0,
    },

    // ───────── Premium / Auth gate patterns (should produce refusals) ─────────
    {
        id: 14,
        name: "premium_gate_page",
        description: "Page showing a premium upgrade prompt, no real video URL",
        html: `<h1>Premium Access Required</h1>
        <p>You need to be a Premium user to download this file</p>
        <a href="/premium/upgrade">Upgrade Now</a>`,
        expectedUrls: [],
        expectedRefusals: 0,
    },
    {
        id: 15,
        name: "login_form_gate",
        description: "Page with a login form blocking download access",
        html: `<form action="/auth/login"><input name="email"><input name="password" type="password"><button>Login</button></form>
        <div>Login to access your downloads on emload.com</div>`,
        expectedUrls: [],
        expectedRefusals: 0,
    },
    {
        id: 16,
        name: "signed_url_with_expiry",
        description: "A signed URL with token and expires params (should be refused)",
        html: `<video src="https://cdn.emload.com/stream/signed.mp4?token=abc123&expires=1700000000&sig=xyz789"></video>`,
        expectedUrls: [],
        expectedRefusals: 1,
    },

    // ───────── CDN subdomain variations ─────────
    {
        id: 17,
        name: "cdn_subdomain_s1",
        description: "Emload CDN subdomain variant s1.emload.com",
        html: `<video><source src="https://s1.emload.com/stream/cdn_s1_video.mp4" type="video/mp4"></video>`,
        expectedUrls: ["https://s1.emload.com/stream/cdn_s1_video.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 18,
        name: "cdn_subdomain_s3",
        description: "Emload CDN subdomain variant s3.emload.com",
        html: `<video src="https://s3.emload.com/dl/cdn_s3_video.mp4"></video>`,
        expectedUrls: ["https://s3.emload.com/dl/cdn_s3_video.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 19,
        name: "cdn_hyphenated_subdomain",
        description: "Emload CDN with cdn-eu.emload.com",
        html: `<script>var file = "https://cdn-eu.emload.com/vip/eu_stream.mp4";</script>`,
        expectedUrls: ["https://cdn-eu.emload.com/vip/eu_stream.mp4"],
        expectedRefusals: 0,
    },

    // ───────── Complex page structures ─────────
    {
        id: 20,
        name: "full_page_skeleton",
        description: "Realistic full page with nav, ads, and buried video source",
        html: `<!DOCTYPE html><html><head><title>EML - Video</title></head><body>
        <header><nav><a href="/">Home</a></nav></header>
        <div class="ad-banner">Advertisement</div>
        <div class="player-container">
            <video id="mainPlayer">
                <source src="https://cdn.emload.com/stream/full_page_video.mp4" type="video/mp4">
            </video>
        </div>
        <div class="comments">User comments here</div>
        <footer>Copyright 2026</footer>
        </body></html>`,
        expectedUrls: ["https://cdn.emload.com/stream/full_page_video.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 21,
        name: "multiple_video_elements",
        description: "Page with multiple <video> elements (ad + main)",
        html: `<video src="https://ad-network.com/preroll.mp4" class="ad-video"></video>
        <video><source src="https://cdn.emload.com/stream/main_content.mp4" type="video/mp4"></video>`,
        expectedUrls: [
            "https://ad-network.com/preroll.mp4",
            "https://cdn.emload.com/stream/main_content.mp4",
        ],
        expectedRefusals: 0,
    },
    {
        id: 22,
        name: "url_in_onclick_handler",
        description: "Download URL embedded in an onclick handler",
        html: `<button onclick="window.open('https://cdn.emload.com/dl/onclick_download.mp4')">Download</button>`,
        expectedUrls: ["https://cdn.emload.com/dl/onclick_download.mp4"],
        expectedRefusals: 0,
    },
    {
        id: 23,
        name: "m3u8_master_playlist_inline",
        description: "HLS master playlist content inline with stream URLs",
        html: `<script>var hlsSrc = "https://cdn.emload.com/stream/master.m3u8";</script>
        <div style="display:none">#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
https://cdn.emload.com/stream/360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
https://cdn.emload.com/stream/1080p/index.m3u8</div>`,
        expectedUrls: [
            "https://cdn.emload.com/stream/master.m3u8",
            "https://cdn.emload.com/stream/360p/index.m3u8",
            "https://cdn.emload.com/stream/1080p/index.m3u8",
        ],
        expectedRefusals: 0,
    },
    {
        id: 24,
        name: "empty_page_no_video",
        description: "Page with no video or media URLs at all",
        html: `<html><body><h1>Welcome to Emload</h1><p>No videos found.</p></body></html>`,
        expectedUrls: [],
        expectedRefusals: 0,
    },
    {
        id: 25,
        name: "mixed_hosts_on_page",
        description: "Emload page referencing both emload.com and external CDN URLs",
        html: `<video>
            <source src="https://cdn.emload.com/stream/primary.mp4" type="video/mp4">
            <source src="https://external-cdn.example.com/mirror.mp4" type="video/mp4">
        </video>`,
        expectedUrls: [
            "https://cdn.emload.com/stream/primary.mp4",
            "https://external-cdn.example.com/mirror.mp4",
        ],
        expectedRefusals: 0,
    },
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EMLOAD_FIXTURES;
}
