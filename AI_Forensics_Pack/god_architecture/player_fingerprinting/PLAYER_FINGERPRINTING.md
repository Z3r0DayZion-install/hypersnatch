
# Universal Player Fingerprinting Engine

Detect common player frameworks automatically.

Supported Players:
- JWPlayer
- VideoJS
- HLS.js
- Shaka
- Flowplayer
- Clappr
- Plyr

Example Detection:

if(window.jwplayer) return "JWPLAYER"
if(window.videojs) return "VIDEOJS"

Benefit:
Thousands of sites reuse the same player frameworks.
