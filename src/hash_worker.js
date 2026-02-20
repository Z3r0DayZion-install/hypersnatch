// ==================== WORKER-BASED HASHING ====================
// Web Worker for SHA-256 hashing of large payloads

// Import crypto in worker context
importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');

let currentJob = null;
let chunkSize = 64 * 1024; // 64KB chunks
let totalProcessed = 0;

// SHA-256 implementation for worker
function sha256(message) {
  return CryptoJS.SHA256(message).toString();
}

function processChunk(chunk, isFinal = false) {
  // Hash the chunk
  const chunkHash = sha256(chunk);
  
  // Send progress update
  self.postMessage({
    type: 'progress',
    jobId: currentJob?.id,
    processed: totalProcessed + chunk.length,
    total: currentJob?.total || 0,
    percentage: currentJob ? Math.round(((totalProcessed + chunk.length) / currentJob.total) * 100) : 0,
    chunkHash
  });
  
  totalProcessed += chunk.length;
  
  if (isFinal) {
    // Send final result
    self.postMessage({
      type: 'complete',
      jobId: currentJob?.id,
      result: chunkHash,
      total: totalProcessed
    });
    
    currentJob = null;
    totalProcessed = 0;
  }
}

// Handle messages from main thread
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'hash':
      handleHashJob(data);
      break;
      
    case 'setChunkSize':
      chunkSize = data;
      self.postMessage({
        type: 'chunkSizeUpdated',
        chunkSize
      });
      break;
      
    case 'cancel':
      if (currentJob && currentJob.id === data.jobId) {
        currentJob = null;
        totalProcessed = 0;
        self.postMessage({
          type: 'cancelled',
          jobId: data.jobId
        });
      }
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};

function handleHashJob(jobData) {
  const { id, data, transferable = false } = jobData;
  
  // Cancel any existing job
  if (currentJob) {
    self.postMessage({
      type: 'error',
      error: 'Another job is already running'
    });
    return;
  }
  
  currentJob = {
    id,
    total: data.length || data.size || 0,
    startTime: Date.now()
  };
  
  totalProcessed = 0;
  
  try {
    if (typeof data === 'string') {
      // Handle string data
      hashString(data);
    } else if (data instanceof ArrayBuffer) {
      // Handle binary data
      hashArrayBuffer(data);
    } else if (data instanceof Blob) {
      // Handle Blob data
      hashBlob(data);
    } else {
      throw new Error('Unsupported data type for hashing');
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      jobId: id,
      error: error.message
    });
    
    currentJob = null;
    totalProcessed = 0;
  }
}

function hashString(data) {
  const length = data.length;
  
  if (length <= chunkSize) {
    // Small string, hash directly
    processChunk(data, true);
  } else {
    // Large string, process in chunks
    for (let i = 0; i < length; i += chunkSize) {
      const chunk = data.substring(i, i + chunkSize);
      const isFinal = i + chunkSize >= length;
      processChunk(chunk, isFinal);
    }
  }
}

function hashArrayBuffer(buffer) {
  const length = buffer.byteLength;
  
  if (length <= chunkSize) {
    // Small buffer, hash directly
    const view = new Uint8Array(buffer);
    const chunk = String.fromCharCode.apply(null, view);
    processChunk(chunk, true);
  } else {
    // Large buffer, process in chunks
    for (let i = 0; i < length; i += chunkSize) {
      const chunkLength = Math.min(chunkSize, length - i);
      const chunk = new Uint8Array(buffer, i, chunkLength);
      const chunkString = String.fromCharCode.apply(null, chunk);
      const isFinal = i + chunkSize >= length;
      processChunk(chunkString, isFinal);
    }
  }
}

function hashBlob(blob) {
  // For Blob, we need to read it first
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const arrayBuffer = e.target.result;
    hashArrayBuffer(arrayBuffer);
  };
  
  reader.onerror = function() {
    self.postMessage({
      type: 'error',
      jobId: currentJob?.id,
      error: 'Failed to read Blob data'
    });
  };
  
  reader.readAsArrayBuffer(blob);
}

// Worker ready
self.postMessage({
  type: 'ready',
  capabilities: {
    supportedTypes: ['string', 'ArrayBuffer', 'Blob'],
    defaultChunkSize: chunkSize,
    maxChunkSize: 1024 * 1024 // 1MB max
  }
});
