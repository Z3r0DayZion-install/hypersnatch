# HLS / DASH Reconstruction

Steps:

1. Locate manifest request in HAR
2. Fetch playlist content (if captured)
3. Identify:
   - bitrate levels
   - resolution
   - segment URLs
4. Build ladder structure

Example ladder.json:

{
  "protocol": "hls",
  "levels": [
    {
      "bitrate": 3000000,
      "resolution": "1920x1080",
      "segments": 120
    }
  ]
}
