/**
 * HyperSnatch Ultra Core - MediaSource Capture Engine Hook
 * 
 * Injected into the target page to intercept raw media segments
 * as they are fed into the browser's video decoder via MSE.
 */

(function () {
    if (window.__hyperSnatchMSEHooked) return;
    window.__hyperSnatchMSEHooked = true;

    console.log('[HyperSnatch] MSE Hook Starting...');

    const OriginalMediaSource = window.MediaSource;
    const originalAddSourceBuffer = OriginalMediaSource ? OriginalMediaSource.prototype.addSourceBuffer : null;
    const originalAppendBuffer = window.SourceBuffer ? window.SourceBuffer.prototype.appendBuffer : null;

    if (!OriginalMediaSource || !originalAppendBuffer) {
        console.warn('[HyperSnatch] MediaSource API not supported or found in this context.');
        return;
    }

    // Track created SourceBuffers
    const sourceBuffers = new WeakMap();
    let bufferCounter = 0;

    // Intercept addSourceBuffer to track mimeTypes
    OriginalMediaSource.prototype.addSourceBuffer = function (mimeType) {
        const sourceBuffer = originalAddSourceBuffer.call(this, mimeType);
        const id = ++bufferCounter;
        sourceBuffers.set(sourceBuffer, { id, mimeType });

        console.log(`[HyperSnatch] Intercepted new SourceBuffer [${id}] for mimeType: ${mimeType}`);

        // Notify external listeners about new stream track
        window.postMessage({
            source: 'hypersnatch-mse',
            type: 'STREAM_TRACK_CREATED',
            payload: { id, mimeType }
        }, '*');

        return sourceBuffer;
    };

    // Intercept appendBuffer to capture media segments
    window.SourceBuffer.prototype.appendBuffer = function (data) {
        const trackInfo = sourceBuffers.get(this);
        if (trackInfo) {
            // In a real high-throughput scenario, sending full ArrayBuffers via postMessage
            // can cause performance drops, so we might want to batch them or use a shared worker/array.
            // For Ultra Core phase, we send it directly for reconstruction pipeline to catch.

            // Calculate a basic hash/size to identify the chunk
            const size = data.byteLength || data.length;

            window.postMessage({
                source: 'hypersnatch-mse',
                type: 'MEDIA_SEGMENT',
                payload: {
                    trackId: trackInfo.id,
                    mimeType: trackInfo.mimeType,
                    size: size,
                    timestamp: Date.now()
                }
            }, '*');

            // (Optional) Actually exfiltrate the chunk data to an extension background script
            // or WebSocket listener if configured.
            if (window.__hyperSnatchCaptureActive) {
                // Exfiltration logic here depending on backend configuration
                // e.g. send to local proxy or extension messaging
            }
        }

        // Call the original browser behavior
        return originalAppendBuffer.call(this, data);
    };

    console.log('[HyperSnatch] MSE Capture Engine Hooks Injected successfully.');
})();
