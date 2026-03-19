# Plugin Architecture

To scale analysis modules use plugin loading.

Example structure:

src/plugins/

timeline_plugin.js
ladder_plugin.js
cdn_plugin.js
token_plugin.js
mse_plugin.js
blob_plugin.js

Each plugin exports:

analyze(bundle)

Return artifact JSON.

Benefits:
• modular analysis
• easy extension
• isolated logic
