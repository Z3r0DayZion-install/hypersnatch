// ==================== DOMPURIFY INTEGRATION ====================
// Safe HTML sanitization for HyperSnatch

"use strict";

// Simple DOMPurify-like implementation for basic sanitization
const SafeHTML = {
  // Basic HTML sanitization
  sanitize: (html) => {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.textContent = html; // This escapes HTML
    
    // If we need to allow specific safe tags, we can implement here
    // For now, return escaped text to prevent XSS
    return temp.innerHTML;
  },

  // Allow only specific safe tags and attributes
  sanitizeWithTags: (html, allowedTags = ['b', 'i', 'em', 'strong', 'span'], allowedAttributes = ['class']) => {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Walk through DOM and remove disallowed elements/attributes
    const cleanElement = (element) => {
      const tagName = element.tagName.toLowerCase();
      
      // Check if tag is allowed
      if (!allowedTags.includes(tagName)) {
        // Replace with text content only
        const textNode = document.createTextNode(element.textContent);
        element.parentNode.replaceChild(textNode, element);
        return;
      }

      // Remove disallowed attributes
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name);
        }
      });
    };

    // Clean all elements
    const walker = document.createTreeWalker(
      temp,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      cleanElement(node);
    }

    return temp.innerHTML;
  }
};

module.exports = SafeHTML;
