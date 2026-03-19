# MODULE GRAPH

```text
Target URL
  |
  v
Runtime Loader
  |
  +--> DOM Scanner -----------+
  |                           |
  +--> Player Fingerprinting  |
  |                           |
  +--> JS Trace --------------+----> Stream Detector ----> Playlist Parser ----> Segment Rebuilder
  |                           |              |
  +--> Network Capture -------+              v
  |                                         Evidence Export
  +--> Memory Scanner --------+              |
  |                           |              v
  +--> MediaSource Capture ---+---------> AI Analyzer (optional)
```

## Key notes
- Stream Detector is the convergence point: it consumes DOM/Trace/HAR/Memory/MSE outputs.
- Evidence Export is not “end of pipeline”; it is a first-class product output.
- AI Analyzer consumes *evidence*, not raw runtime.
