
# Browser Memory Forensics Engine

Goal:
Capture video segments directly from memory buffers when streams are hidden.

Technique:
Intercept MediaSource and SourceBuffer APIs.

Example Hook:

const origAppend = SourceBuffer.prototype.appendBuffer

SourceBuffer.prototype.appendBuffer = function(buf){
  window.__capturedSegments = window.__capturedSegments || []
  window.__capturedSegments.push(buf)
  return origAppend.call(this, buf)
}

Result:
Segments captured from memory can be reconstructed into a final video stream.
