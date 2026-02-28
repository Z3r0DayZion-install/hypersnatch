use anyhow::{Context, Result};
use base64::Engine;
use clap::{Parser, Subcommand};
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::io::{Read, Write};
use url::Url;

#[derive(Parser, Debug)]
#[command(name = "hs-core")]
#[command(about = "HyperSnatch Rust Core", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand, Debug)]
enum Command {
    /// SmartDecode-compatible extraction pipeline
    Smartdecode {
        /// Read a JSON request from stdin: {"input": "...", "splitSegments": false}
        #[arg(long)]
        json: bool,
    },
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct SmartdecodeRequest {
    input: String,
    #[serde(default)]
    split_segments: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct Candidate {
    url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    r#type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    source_layer: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    confidence: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    fingerprint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    final_score: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct Refusal {
    host: String,
    reason: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    markers: Option<Vec<String>>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct SmartdecodeResponse {
    version: String,
    candidates: Vec<Candidate>,
    best: Option<Candidate>,
    refusals: Vec<Refusal>,
}

fn sha256_hex(s: &str) -> String {
    let mut h = Sha256::new();
    h.update(s.as_bytes());
    hex::encode(h.finalize())
}

fn normalize_input(raw: &str) -> String {
    // Mirrors src/core/smartdecode/preprocessor.js
    let mut s = raw.replace("\r\n", "\n").replace('\r', "\n");

    // Repair split extensions: ".\n m3u8" => ".m3u8"
    // Keep narrowly scoped like JS.
    let re_ext = Regex::new(r"(?i)\.\s*\n\s*(m3u8|u8|m3u|mp4|ts|m4s|m4a|webm|mkv|mov|mpd|jpg|png|gif)\b")
        .expect("re_ext");
    s = re_ext.replace_all(&s, ".$1").to_string();

    // Repair base64 data URIs: strip whitespace in payload
    let re_data = Regex::new(r#"(?is)(data:[^;]+;base64,)([\s\S]+?)(["']|$)"#).expect("re_data");
    s = re_data
        .replace_all(&s, |caps: &regex::Captures<'_>| {
            let head = caps.get(1).map(|m| m.as_str()).unwrap_or("");
            let body = caps.get(2).map(|m| m.as_str()).unwrap_or("");
            let tail = caps.get(3).map(|m| m.as_str()).unwrap_or("");
            let body2: String = body.chars().filter(|c| !c.is_whitespace()).collect();
            format!("{}{}{}", head, body2, tail)
        })
        .to_string();

    // Collapse 3+ newlines -> 2 newlines
    let re_nl = Regex::new(r"\n{3,}").expect("re_nl");
    s = re_nl.replace_all(&s, "\n\n").to_string();

    s.trim().to_string()
}

fn scan_http_urls(text: &str) -> Vec<String> {
    let re = Regex::new(r#"(?i)https?://[^\s"'<>]+"#).expect("re");
    let mut out = Vec::new();
    for m in re.find_iter(text) {
        let mut u = m.as_str().to_string();
        while u.ends_with([')', ',', '.', ';'].as_ref()) {
            u.pop();
        }
        out.push(u);
    }
    out
}

fn infer_type(url: &str) -> String {
    let lower = url.to_lowercase();
    let path = lower.split('?').next().unwrap_or(&lower);
    if path.ends_with(".m3u8") {
        return "hls".to_string();
    }
    if path.ends_with(".mp4") {
        return "mp4".to_string();
    }
    if path.ends_with(".ts") {
        return "segment".to_string();
    }
    "unknown".to_string()
}

fn classify_type(url: &str, html: &str) -> String {
    // Mirrors src/core/smartdecode/index.js classifyType
    if let Ok(parsed) = Url::parse(url) {
        let p = parsed.path().to_lowercase();
        if p.ends_with(".m3u8") {
            return "m3u8".to_string();
        }
        if p.ends_with(".mp4") {
            return "mp4".to_string();
        }
    } else {
        let lower = url.to_lowercase();
        let base = lower.split('?').next().unwrap_or(&lower);
        if base.ends_with(".m3u8") {
            return "m3u8".to_string();
        }
        if base.ends_with(".mp4") {
            return "mp4".to_string();
        }
    }

    if html.contains("#EXTM3U") {
        return "hls".to_string();
    }

    "video".to_string()
}

fn calc_confidence(url: &str, source_layer: &str) -> f64 {
    // Mirrors src/core/smartdecode/direct.js heuristics
    let mut c: f64 = 0.5;
    if url.contains("playlist.m3u8") {
        c += 0.3;
    }
    if url.contains(".mp4") {
        c += 0.2;
    }
    if source_layer == "hls_focused" {
        c += 0.1;
    }
    c.min(0.95)
}

fn normalize_url(url: &str) -> Option<String> {
    match Url::parse(url) {
        Ok(u) => {
            let scheme = u.scheme().to_lowercase();
            if scheme != "http" && scheme != "https" {
                return None;
            }
            Some(u.to_string())
        }
        Err(_) => None,
    }
}

fn direct_extract(input: &str) -> Vec<Candidate> {
    // Mirrors src/core/smartdecode/direct.js
    let stream = Regex::new(r#"(?i)(https?://[^\s\"'`<>]+?\.(mp4|m3u8|ts|zip)(?:\?[^\s\"'`<>]+)?)"#)
        .expect("stream");
    let hls = Regex::new(r#"(?i)(https?://[^\s\"'`<>]+?playlist\.m3u8(?:\?[^\s\"'`<>]+)?)"#).expect("hls");
    let buried = Regex::new(r#"(?i)[\"'](https?://[^\"']+?\.(?:mp4|m3u8|ts|zip)[^\"']*?)[\"']"#).expect("buried");

    let mut map: BTreeMap<String, Candidate> = BTreeMap::new();

    for (re, layer) in [(&stream, "direct_regex"), (&hls, "hls_focused"), (&buried, "buried_string")] {
        for caps in re.captures_iter(input) {
            let url = caps.get(1).map(|m| m.as_str()).unwrap_or("");
            if let Some(norm) = normalize_url(url) {
                if !map.contains_key(&norm) {
                    let t = infer_type(&norm);
                    let conf = calc_confidence(&norm, layer);
                    map.insert(
                        norm.clone(),
                        Candidate {
                            url: norm,
                            host: None,
                            r#type: Some(t),
                            source_layer: Some(layer.to_string()),
                            confidence: Some(conf),
                            fingerprint: None,
                            status: None,
                            height: None,
                            final_score: None,
                        },
                    );
                }
            }
        }
    }

    map.into_values().collect()
}

fn decode_b64_to_string(b64: &str) -> Option<String> {
    let engine = base64::engine::general_purpose::STANDARD;
    let bytes = engine.decode(b64.as_bytes()).ok()?;
    // Base64 in this project is used for embedding HTML/JS; utf8-lossy is fine.
    Some(String::from_utf8_lossy(&bytes).to_string())
}

fn base64_extract(input: &str) -> Vec<Candidate> {
    // Mirrors src/core/smartdecode/base64.js
    let re = Regex::new(r"([A-Za-z0-9+/]{32,}(?:={0,2}))").expect("b64");
    let mut out: BTreeMap<String, Candidate> = BTreeMap::new();

    for caps in re.captures_iter(input) {
        let b64 = caps.get(1).map(|m| m.as_str()).unwrap_or("");
        // Cap by input size, like JS (8MB) but in chars.
        if b64.len() > 8 * 1024 * 1024 {
            continue;
        }
        let decoded = match decode_b64_to_string(b64) {
            Some(s) if s.len() > 10 => s,
            _ => continue,
        };
        for c in direct_extract(&decoded) {
            let key = c.url.clone();
            if !out.contains_key(&key) {
                let mut c2 = c.clone();
                c2.source_layer = Some("base64_decoded".to_string());
                c2.confidence = c2.confidence.map(|x| x * 0.9);
                out.insert(key, c2);
            }
        }
    }

    out.into_values().collect()
}

fn unescape_html(s: &str) -> String {
    s.replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
}

fn iframe_extract(input: &str, depth: usize) -> Result<Vec<Candidate>> {
    if depth >= 3 {
        return Ok(Vec::new());
    }

    let re_srcdoc = Regex::new(r#"(?is)<iframe\b[^>]+srcdoc=[\"']([\s\S]+?)[\"']"#).expect("srcdoc");
    let re_data = Regex::new(r#"(?is)<iframe\b[^>]+src=[\"']data:text/html;base64,([A-Za-z0-9+/=]+)[\"']"#)
        .expect("data");

    let mut map: BTreeMap<String, Candidate> = BTreeMap::new();

    for caps in re_srcdoc.captures_iter(input) {
        let raw = caps.get(1).map(|m| m.as_str()).unwrap_or("");
        let html = unescape_html(raw);
        let found = process_segment(&html, depth + 1)?;
        for c in found {
            let key = c.url.clone();
            if !map.contains_key(&key) {
                let mut c2 = c.clone();
                let prev = c2.source_layer.clone().unwrap_or_else(|| "".to_string());
                c2.source_layer = Some(format!("iframe_srcdoc > {}", prev));
                c2.confidence = c2.confidence.map(|x| x * 0.85);
                map.insert(key, c2);
            }
        }
    }

    for caps in re_data.captures_iter(input) {
        let b64 = caps.get(1).map(|m| m.as_str()).unwrap_or("");
        if let Some(html) = decode_b64_to_string(b64) {
            let found = process_segment(&html, depth + 1)?;
            for c in found {
                let key = c.url.clone();
                if !map.contains_key(&key) {
                    let mut c2 = c.clone();
                    let prev = c2.source_layer.clone().unwrap_or_else(|| "".to_string());
                    c2.source_layer = Some(format!("iframe_data_uri > {}", prev));
                    c2.confidence = c2.confidence.map(|x| x * 0.85);
                    map.insert(key, c2);
                }
            }
        }
    }

    Ok(map.into_values().collect())
}

fn auth_check(url: &str, html: &str) -> (bool, Option<String>) {
    // A minimal, deterministic subset that matches tests.
    if url.trim().is_empty() {
        return (true, Some("invalid_url:empty_or_non_string".to_string()));
    }

    let parsed = match Url::parse(url) {
        Ok(u) => u,
        Err(_) => {
            return (true, Some("signed_url_detected:unparseable_url".to_string()));
        }
    };

    // Signed query params
    let signed: BTreeSet<&'static str> = [
        "token",
        "access_token",
        "auth_token",
        "bearer",
        "sig",
        "signature",
        "hmac",
        "hash",
        "expires",
        "expiry",
        "exp",
        "expiration",
        "ttl",
        "until",
        "x-amz-signature",
        "x-amz-credential",
        "x-amz-security-token",
    ]
    .into_iter()
    .collect();

    for (k, _) in parsed.query_pairs() {
        let lk = k.to_lowercase();
        if signed.contains(lk.as_str()) {
            return (true, Some(format!("signed_url_detected:{}", lk)));
        }
    }

    let lower_url = url.to_lowercase();
    if lower_url.contains("/pass_md5/") {
        return (true, Some("auth_path_segment:/pass_md5/".to_string()));
    }

    // HTML gates
    if !html.is_empty() {
        let login_form = Regex::new(r#"(?is)<form[^>]+action=[\"'][^\"']*(?:login|signin|sign-in|auth)[^\"']*[\"']"#)
            .unwrap();
        if login_form.is_match(html) {
            return (true, Some("login_gate:form_action".to_string()));
        }

        let upgrade = Regex::new(r"(?is)upgrade\s+to\s+download").unwrap();
        if upgrade.is_match(html) {
            return (true, Some("premium_gate:upgrade_to_download".to_string()));
        }

        let premium = Regex::new(r"(?is)(premium|paid|pro)\s+user\s+to\s+download").unwrap();
        if premium.is_match(html) {
            return (true, Some("premium_gate:premium_user".to_string()));
        }
    }

    (false, None)
}

fn rank_candidates(mut candidates: Vec<Candidate>) -> Vec<Candidate> {
    for c in candidates.iter_mut() {
        let mut score = c.confidence.unwrap_or(0.5);
        let host = Url::parse(&c.url).ok().and_then(|u| u.host_str().map(|h| h.to_string()));
        c.host = host;

        if c.host.is_none() {
            c.final_score = Some(0.0);
            continue;
        }

        let t = c.r#type.clone().unwrap_or_else(|| "unknown".to_string());
        if t == "hls" || t == "m3u8" {
            score += 0.2;
        }
        if t == "hls_variant" {
            score += 0.15;
        }
        if t == "mp4" {
            score += 0.1;
        }

        if let Some(h) = c.height {
            if h >= 1080 {
                score += 0.3;
            } else if h >= 720 {
                score += 0.2;
            } else if h >= 480 {
                score += 0.1;
            }
        }

        let lower = c.url.to_lowercase();
        if lower.contains("1080p") || lower.contains("fhd") {
            score += 0.1;
        }
        if lower.contains("720p") || lower.contains("hd-") {
            score += 0.05;
        }
        if lower.contains("master") {
            score += 0.1;
        }

        if c.source_layer.as_deref() == Some("hls_focused") {
            score += 0.1;
        }
        if c.source_layer.as_deref() == Some("unpacker_result") {
            score += 0.05;
        }

        c.final_score = Some(score.min(1.0));
    }

    // Deterministic sort: score desc, then host/type/url asc
    candidates.sort_by(|a, b| {
        let sa = a.final_score.unwrap_or(0.0);
        let sb = b.final_score.unwrap_or(0.0);
        sb.partial_cmp(&sa)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.host.clone().unwrap_or_default().cmp(&b.host.clone().unwrap_or_default()))
            .then_with(|| a.r#type.clone().unwrap_or_default().cmp(&b.r#type.clone().unwrap_or_default()))
            .then_with(|| a.url.cmp(&b.url))
    });

    candidates
}

fn process_segment(html: &str, depth: usize) -> Result<Vec<Candidate>> {
    let mut refused: Vec<Refusal> = Vec::new();

    // Packed JS signature check (same behavior: if packed and no static urls -> reject)
    let has_packed = Regex::new(r"(?i)eval\(function\(p,a,c,k,e,d\)").unwrap().is_match(html);
    if has_packed {
        let static_urls = direct_extract(html);
        if static_urls.is_empty() {
            return Ok(Vec::new());
        }
    }

    let mut raw: Vec<Candidate> = Vec::new();
    raw.extend(direct_extract(html));
    raw.extend(base64_extract(html));
    raw.extend(iframe_extract(html, depth)?);

    let mut by_url: BTreeMap<String, Candidate> = BTreeMap::new();

    for mut c in raw {
        let url_str = c.url.clone();

        if !url_str.to_lowercase().starts_with("http://") && !url_str.to_lowercase().starts_with("https://") {
            refused.push(Refusal {
                host: c.host.clone().unwrap_or_else(|| "unknown".to_string()),
                reason: "incomplete_or_relative_url".to_string(),
                status: Some("rejected".to_string()),
                url: Some(url_str),
                markers: None,
            });
            continue;
        }

        let (requires, reason) = auth_check(&url_str, html);
        if requires {
            refused.push(Refusal {
                host: c.host.clone().unwrap_or_else(|| {
                    Url::parse(&url_str)
                        .ok()
                        .and_then(|u| u.host_str().map(|h| h.to_string()))
                        .unwrap_or_else(|| "unknown".to_string())
                }),
                reason: reason.unwrap_or_else(|| "requires_auth".to_string()),
                status: Some("rejected".to_string()),
                url: Some(url_str),
                markers: None,
            });
            continue;
        }

        let finalized = classify_type(&url_str, html);
        c.r#type = Some(finalized);
        c.fingerprint = Some(sha256_hex(&url_str));
        c.status = Some("accepted".to_string());

        let key_new = format!(
            "{}\u{0}\u{0}{}\u{0}\u{0}{}",
            c.host.clone().unwrap_or_default(),
            c.r#type.clone().unwrap_or_default(),
            c.url
        );

        if let Some(prev) = by_url.get(&url_str) {
            let key_prev = format!(
                "{}\u{0}\u{0}{}\u{0}\u{0}{}",
                prev.host.clone().unwrap_or_default(),
                prev.r#type.clone().unwrap_or_default(),
                prev.url
            );
            if key_new < key_prev {
                by_url.insert(url_str, c);
            }
        } else {
            by_url.insert(url_str, c);
        }
    }

    // URL sweep for auth violations
    for u in scan_http_urls(html) {
        let (requires, reason) = auth_check(&u, html);
        if requires {
            let host = Url::parse(&u)
                .ok()
                .and_then(|x| x.host_str().map(|h| h.to_string()))
                .unwrap_or_else(|| "unknown".to_string());
            refused.push(Refusal {
                host,
                reason: reason.unwrap_or_else(|| "Cash Policy Shield violation".to_string()),
                status: None,
                url: None,
                markers: Some(vec!["premium".to_string()]),
            });
        }
    }

    // Rank candidates
    let candidates: Vec<Candidate> = by_url.into_values().collect();
    let ranked = rank_candidates(candidates);

    // We don't emit refusals from this function; caller sorts.
    // Caller still needs ranked.
    Ok(ranked)
}

fn smartdecode_run(input: &str, split_segments: bool) -> Result<SmartdecodeResponse> {
    let normalized = normalize_input(input);
    let segments: Vec<String> = if split_segments {
        let re = Regex::new(r"\n\n+").unwrap();
        re.split(&normalized).map(|s| s.to_string()).collect()
    } else {
        vec![normalized]
    };
    let mut all_candidates: Vec<Candidate> = Vec::new();
    let mut all_refusals: Vec<Refusal> = Vec::new();

    for seg in segments {
        if seg.trim().is_empty() {
            continue;
        }
        // For now, process_segment returns ranked candidates, but we also need refusals.
        // To keep this first Rust cut minimal, we do an auth sweep into refusals here.
        let ranked = process_segment(&seg, 0)?;
        all_candidates.extend(ranked);

        // Sweep auth-based refusals (same as JS; keeps audit visibility)
        for u in scan_http_urls(&seg) {
            let (requires, reason) = auth_check(&u, &seg);
            if requires {
                let host = Url::parse(&u)
                    .ok()
                    .and_then(|x| x.host_str().map(|h| h.to_string()))
                    .unwrap_or_else(|| "unknown".to_string());
                all_refusals.push(Refusal {
                    host,
                    reason: reason.unwrap_or_else(|| "Cash Policy Shield violation".to_string()),
                    status: Some("rejected".to_string()),
                    url: Some(u),
                    markers: Some(vec!["premium".to_string()]),
                });
            }
        }
    }

    // Deterministic de-dupe across segments by url: keep lowest host/type/url
    let mut by_url: BTreeMap<String, Candidate> = BTreeMap::new();
    for mut c in all_candidates {
        if c.host.is_none() {
            c.host = Url::parse(&c.url).ok().and_then(|u| u.host_str().map(|h| h.to_string()));
        }
        let url = c.url.clone();
        let key_new = format!(
            "{}\u{0}\u{0}{}\u{0}\u{0}{}",
            c.host.clone().unwrap_or_default(),
            c.r#type.clone().unwrap_or_default(),
            c.url
        );
        if let Some(prev) = by_url.get(&url) {
            let key_prev = format!(
                "{}\u{0}\u{0}{}\u{0}\u{0}{}",
                prev.host.clone().unwrap_or_default(),
                prev.r#type.clone().unwrap_or_default(),
                prev.url
            );
            if key_new < key_prev {
                by_url.insert(url, c);
            }
        } else {
            by_url.insert(url, c);
        }
    }

    let ranked = rank_candidates(by_url.into_values().collect());
    let best = ranked.first().cloned();

    // Deterministic refusal sort
    all_refusals.sort_by(|a, b| {
        a.host
            .cmp(&b.host)
            .then_with(|| a.reason.cmp(&b.reason))
            .then_with(|| a.url.clone().unwrap_or_default().cmp(&b.url.clone().unwrap_or_default()))
    });

    Ok(SmartdecodeResponse {
        version: "hs-core/0.1.0".to_string(),
        candidates: ranked,
        best,
        refusals: all_refusals,
    })
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let cmd = cli.command.unwrap_or(Command::Smartdecode { json: false });

    match cmd {
        Command::Smartdecode { json } => {
            let mut buf = String::new();
            std::io::stdin().read_to_string(&mut buf).context("read stdin")?;

            let req = if json {
                serde_json::from_str::<SmartdecodeRequest>(&buf).context("parse json request")?
            } else {
                SmartdecodeRequest {
                    input: buf,
                    split_segments: false,
                }
            };

            let resp = smartdecode_run(&req.input, req.split_segments)
                .with_context(|| "smartdecode")?;

            let out = serde_json::to_string(&resp).context("serialize response")?;
            let mut stdout = std::io::stdout();
            stdout.write_all(out.as_bytes()).context("write stdout")?;
            stdout.write_all(b"\n").ok();
            Ok(())
        }
    }
}
