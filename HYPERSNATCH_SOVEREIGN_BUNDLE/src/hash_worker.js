// ==================== WORKER-BASED HASHING (OPTIMIZED) ====================
"use strict";

let currentJob = null;
let chunkSize = 1024 * 1024; // 1MB chunks for native crypto
let totalProcessed = 0;

// Handle messages from main thread
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'hash':
      await handleHashJob(data);
      break;
      
    case 'setChunkSize':
      chunkSize = data;
      self.postMessage({ type: 'chunkSizeUpdated', chunkSize });
      break;
      
    case 'cancel':
      if (currentJob && currentJob.id === data.jobId) {
        currentJob = null;
        totalProcessed = 0;
        self.postMessage({ type: 'cancelled', jobId: data.jobId });
      }
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};

async function handleHashJob(jobData) {
  const { id, data } = jobData;
  
  if (currentJob) {
    self.postMessage({ type: 'error', error: 'Another job is already running' });
    return;
  }
  
  let buffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data).buffer;
  } else if (data instanceof ArrayBuffer) {
    buffer = data;
  } else if (data instanceof Blob) {
    buffer = await data.arrayBuffer();
  } else {
    self.postMessage({ type: 'error', jobId: id, error: 'Unsupported data type' });
    return;
  }

  currentJob = { id, total: buffer.byteLength };
  totalProcessed = 0;

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    self.postMessage({
      type: 'complete',
      jobId: id,
      result: hashHex,
      total: buffer.byteLength
    });
  } catch (error) {
    self.postMessage({ type: 'error', jobId: id, error: error.message });
  } finally {
    currentJob = null;
  }
}

self.postMessage({ type: 'ready' });
