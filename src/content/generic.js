// Prevent redeclaration if script is loaded multiple times
if (typeof window.GenericExtractor === 'undefined') {

class GenericExtractor {
  constructor() {
    this.data = {};
    this.isDataReady = false;
  }

  extractPageData() {
    try {
      const data = {
        title: this.extractTitle(),
        content: this.extractMainContent(),
        url: window.location.href,
        domain: window.location.hostname,
        timestamp: new Date().toISOString()
      };

      this.data = data;
      this.isDataReady = true;
      
      console.log('Generic page data extracted:', data);
      return data;
    } catch (error) {
      console.error('Error extracting page data:', error);
      return null;
    }
  }

  extractTitle() {
    // Try multiple title sources
    const titleSelectors = [
      'h1',
      'title',
      '[property="og:title"]',
      '.entry-title',
      '.post-title',
      '.article-title'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = selector === 'title' ? 
          element.textContent : 
          element.getAttribute('content') || element.textContent;
        
        if (text && text.trim()) {
          return text.trim();
        }
      }
    }
    
    return document.title || '';
  }

  extractMainContent() {
    // Priority selectors for main content
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'article'
    ];

    // Try to find main content area
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = this.extractTextFromElement(element);
        if (text && text.length > 100) { // Ensure meaningful content
          return this.cleanText(text);
        }
      }
    }

    // Fallback: extract from body but filter out navigation, sidebar, footer
    const body = document.body;
    if (body) {
      // Remove unwanted elements
      const unwantedSelectors = [
        'nav', 'header', 'footer', 'aside', 
        '.nav', '.navigation', '.menu', '.sidebar', 
        '.header', '.footer', '.advertisement', '.ad',
        '.social-share', '.comments', '.related-posts',
        'script', 'style', 'noscript'
      ];
      
      const bodyClone = body.cloneNode(true);
      unwantedSelectors.forEach(selector => {
        const elements = bodyClone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      const text = this.extractTextFromElement(bodyClone);
      return this.cleanText(text);
    }

    return '';
  }

  extractTextFromElement(element) {
    if (!element) return '';
    
    // Get all text nodes, preserving paragraph breaks
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty text nodes and script/style content
          const parent = node.parentNode;
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.textContent.trim() === '') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const texts = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text) {
        texts.push(text);
      }
    }

    return texts.join(' ');
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim()
      .substring(0, 2000); // Limit length for processing
  }

  formatForDisplay() {
    if (!this.isDataReady) {
      this.extractPageData();
    }

    const { title, content, domain } = this.data;
    
    let preview = '';
    
    if (domain) preview += `Source: ${domain}\n`;
    if (title) preview += `Title: ${title}\n\n`;
    
    if (content) {
      const truncatedContent = content.length > 300 ? 
        content.substring(0, 300) + '...' : content;
      preview += `Content: ${truncatedContent}`;
    }
    
    return preview.trim();
  }

  getStructuredData() {
    if (!this.isDataReady) {
      this.extractPageData();
    }
    return this.data;
  }

  // Check if this page has extractable content
  hasMeaningfulContent() {
    const content = this.extractMainContent();
    const title = this.extractTitle();
    return (content && content.length > 50) || (title && title.length > 10);
  }
}

// Initialize extractor
window.GenericExtractor = GenericExtractor;
const genericExtractor = new GenericExtractor();

// Listen for requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Generic content script received message:', request);
  
  if (request.action === 'extractGenericData') {
    try {
      // Only respond if this isn't LinkedIn (LinkedIn script handles that)
      if (window.location.hostname !== 'www.linkedin.com') {
        const data = genericExtractor.getStructuredData();
        const preview = genericExtractor.formatForDisplay();
        const hasMeaningful = genericExtractor.hasMeaningfulContent();
        
        console.log('Generic extraction results:', { data, preview, hasMeaningful });
        
        sendResponse({
          success: hasMeaningful,
          data: data,
          preview: preview,
          source: 'generic',
          hasMeaningfulContent: hasMeaningful
        });
      } else {
        console.log('Skipping generic extraction on LinkedIn');
        sendResponse({ success: false, reason: 'LinkedIn page' });
      }
    } catch (error) {
      console.error('Generic extraction error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true; // Keep message channel open for async response
});

// Auto-extract data when page loads (for faster popup response)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hostname !== 'www.linkedin.com') {
      setTimeout(() => genericExtractor.extractPageData(), 500);
    }
  });
} else {
  if (window.location.hostname !== 'www.linkedin.com') {
    setTimeout(() => genericExtractor.extractPageData(), 500);
  }
}

} else {
  console.log('Generic extractor already loaded - reusing existing instance');
}

console.log('Generic content script loaded');