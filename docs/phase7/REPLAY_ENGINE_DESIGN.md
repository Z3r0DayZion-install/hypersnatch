# Bundle Replay Engine

Goal: Recreate streaming sessions from .hyper bundles.

Inputs:

.hyper bundle

Replay pipeline:

bundle → load artifacts
→ reconstruct manifest
→ simulate segment requests
→ emulate player state

Outputs:

replay timeline
segment fetch simulation
bitrate switching visualization

Modules:

replayLoader.js
manifestRebuilder.js
segmentSimulator.js
playerEmulator.js
