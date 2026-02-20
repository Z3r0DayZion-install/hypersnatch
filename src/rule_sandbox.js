// ==================== RULE TEST SANDBOX ====================
"use strict";

const RuleSandbox = {
  testVectors: [
    {
      name: "Basic HTML Link Extraction",
      html: `<div><a href="https://example.com/file.pdf">Download PDF</a></div>`,
      expected: {
        type: "url",
        content: "https://example.com/file.pdf",
        confidence: 0.9,
        metadata: { selector: "a[href]" }
      }
    },
    {
      name: "Multiple Links with Different Confidence",
      html: `
        <div>
          <a href="https://trusted.com/important.pdf">Important Doc</a>
          <a href="https://suspicious.com/unknown.exe">Unknown File</a>
          <link rel="stylesheet" href="https://cdn.example.com/style.css">
        </div>
      `,
      expected: {
        items: [
          {
            type: "url",
            content: "https://trusted.com/important.pdf",
            confidence: 0.8,
            metadata: { selector: "a[href]" }
          },
          {
            type: "url", 
            content: "https://suspicious.com/unknown.exe",
            confidence: 0.3,
            metadata: { selector: "a[href]" }
          },
          {
            type: "url",
            content: "https://cdn.example.com/style.css",
            confidence: 0.6,
            metadata: { selector: "link[href]" }
          }
        ]
      }
    },
    {
      name: "Media Extraction",
      html: `
        <div>
          <img src="https://example.com/image.jpg" alt="Test Image">
          <video src="https://example.com/video.mp4" controls></video>
          <audio src="https://example.com/audio.mp3" controls></audio>
        </div>
      `,
      expected: {
        items: [
          {
            type: "media",
            content: "https://example.com/image.jpg",
            confidence: 0.9,
            metadata: { selector: "img[src]" }
          },
          {
            type: "media",
            content: "https://example.com/video.mp4",
            confidence: 0.9,
            metadata: { selector: "video[src]" }
          },
          {
            type: "media",
            content: "https://example.com/audio.mp3",
            confidence: 0.9,
            metadata: { selector: "audio[src]" }
          }
        ]
      }
    },
    {
      name: "Text Content Extraction",
      html: `
        <div>
          <p>This is some text content</p>
          <span class="important">Important information here</span>
          <script>var secret = "hidden";</script>
        </div>
      `,
      expected: {
        items: [
          {
            type: "text",
            content: "This is some text content",
            confidence: 0.7,
            metadata: { selector: "p" }
          },
          {
            type: "text",
            content: "Important information here",
            confidence: 0.8,
            metadata: { selector: ".important" }
          }
        ]
      }
    }
  ],
  
  currentTestIndex: 0,
  
  init() {
    console.log('🧪 Rule Test Sandbox initialized');
  },
  
  runTest(testIndex) {
    if (testIndex < 0 || testIndex >= this.testVectors.length) {
      throw new Error(`Invalid test index: ${testIndex}`);
    }
    
    const test = this.testVectors[testIndex];
    console.log(`🧪 Running test: ${test.name}`);
    
    // Create temporary DOM for testing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = test.html;
    
    // Run extraction rules
    const extracted = this.extractFromDOM(tempDiv);
    
    // Compare with expected results
    const results = this.compareResults(extracted, test.expected);
    
    // Display results
    this.displayResults(test, extracted, results);
    
    return results;
  },
  
  extractFromDOM(domElement) {
    const items = [];
    
    // Extract links
    const links = domElement.querySelectorAll('a[href]');
    links.forEach(link => {
      items.push({
        type: 'url',
        content: link.href,
        confidence: this.calculateConfidence(link),
        metadata: { selector: 'a[href]', text: link.textContent }
      });
    });
    
    // Extract media
    const media = domElement.querySelectorAll('img[src], video[src], audio[src]');
    media.forEach(element => {
      items.push({
        type: 'media',
        content: element.src || element.getAttribute('src'),
        confidence: this.calculateConfidence(element),
        metadata: { 
          selector: element.tagName.toLowerCase() + '[src]',
          tag: element.tagName.toLowerCase()
        }
      });
    });
    
    // Extract text content
    const textElements = domElement.querySelectorAll('p, span, div');
    textElements.forEach(element => {
      if (element.textContent.trim()) {
        items.push({
          type: 'text',
          content: element.textContent.trim(),
          confidence: this.calculateConfidence(element),
          metadata: { 
            selector: element.tagName.toLowerCase(),
            className: element.className,
            id: element.id
          }
        });
      }
    });
    
    return items;
  },
  
  calculateConfidence(element) {
    let confidence = 0.5; // Base confidence
    
    // Boost for specific selectors
    if (element.className && element.className.includes('important')) {
      confidence += 0.3;
    }
    
    // Boost for semantic tags
    const semanticTags = ['a', 'img', 'video', 'audio'];
    if (semanticTags.includes(element.tagName.toLowerCase())) {
      confidence += 0.2;
    }
    
    // Boost for direct attributes
    if (element.href || element.src) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  },
  
  compareResults(extracted, expected) {
    const results = {
      passed: true,
      matches: [],
      missing: [],
      extra: [],
      confidenceErrors: []
    };
    
    // Check if expected number of items matches
    if (expected.items && extracted.length !== expected.items.length) {
      results.passed = false;
      results.missing.push(`Expected ${expected.items.length} items, got ${extracted.length}`);
    }
    
    // Compare each expected item
    if (expected.items) {
      for (const expectedItem of expected.items) {
        const match = extracted.find(item => 
          item.type === expectedItem.type && 
          item.content === expectedItem.content
        );
        
        if (match) {
          results.matches.push({
            expected: expectedItem,
            actual: match
          });
          
          // Check confidence
          if (Math.abs(match.confidence - expectedItem.confidence) > 0.1) {
            results.confidenceErrors.push({
              content: expectedItem.content,
              expected: expectedItem.confidence,
              actual: match.confidence,
              difference: Math.abs(match.confidence - expectedItem.confidence)
            });
          }
        } else {
          results.missing.push(expectedItem);
        }
      }
    }
    
    // Find extra items
    for (const extractedItem of extracted) {
      const expected = expected.items ? expected.items.find(item => 
        item.type === extractedItem.type && 
        item.content === extractedItem.content
      ) : null;
      
      if (!expected) {
        results.extra.push(extractedItem);
      }
    }
    
    return results;
  },
  
  displayResults(test, extracted, results) {
    console.log(`\n📊 Test Results for: ${test.name}`);
    console.log(`Overall: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (results.matches.length > 0) {
      console.log('\n✅ Matched Items:');
      results.matches.forEach(match => {
        console.log(`  ${match.type}: ${match.content} (confidence: ${match.confidence})`);
      });
    }
    
    if (results.missing.length > 0) {
      console.log('\n❌ Missing Items:');
      results.missing.forEach(item => {
        console.log(`  ${item.type}: ${item.content} (expected confidence: ${item.confidence})`);
      });
    }
    
    if (results.extra.length > 0) {
      console.log('\n⚠️ Extra Items:');
      results.extra.forEach(item => {
        console.log(`  ${item.type}: ${item.content} (confidence: ${item.confidence})`);
      });
    }
    
    if (results.confidenceErrors.length > 0) {
      console.log('\n⚠️ Confidence Errors:');
      results.confidenceErrors.forEach(error => {
        console.log(`  ${error.content}: expected ${error.expected}, got ${error.actual} (diff: ${error.difference})`);
      });
    }
    
    // Update UI
    this.updateTestUI(test, extracted, results);
  },
  
  updateTestUI(test, extracted, results) {
    // Update test selector
    const testSelect = document.getElementById('ruleTestSelect');
    if (testSelect) {
      testSelect.innerHTML = this.testVectors.map((test, index) => 
        `<option value="${index}">${test.name}</option>`
      ).join('');
      testSelect.value = this.currentTestIndex;
    }
    
    // Update input area
    const inputArea = document.getElementById('ruleTestInput');
    if (inputArea) {
      inputArea.value = test.html;
    }
    
    // Update results area
    const resultsArea = document.getElementById('ruleTestResults');
    if (resultsArea) {
      const statusClass = results.passed ? 'test-passed' : 'test-failed';
      resultsArea.innerHTML = `
        <div class="test-status ${statusClass}">
          <h4>${results.passed ? '✅ PASSED' : '❌ FAILED'}</h4>
          <div class="test-summary">
            <div>Extracted: ${extracted.length} items</div>
            <div>Expected: ${test.expected ? test.expected.items.length : 0} items</div>
            <div>Matches: ${results.matches.length}</div>
            <div>Missing: ${results.missing.length}</div>
            <div>Extra: ${results.extra.length}</div>
          </div>
        </div>
      `;
    }
  },
  
  runAllTests() {
    console.log('🧪 Running all rule test vectors...');
    
    const allResults = [];
    
    for (let i = 0; i < this.testVectors.length; i++) {
      const results = this.runTest(i);
      allResults.push({
        testName: this.testVectors[i].name,
        passed: results.passed,
        results
      });
    }
    
    const passedCount = allResults.filter(r => r.passed).length;
    const totalCount = allResults.length;
    
    console.log(`\n📊 Final Results: ${passedCount}/${totalCount} tests passed`);
    
    return allResults;
  }
};

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.RuleSandbox = RuleSandbox;
}

module.exports = RuleSandbox;
