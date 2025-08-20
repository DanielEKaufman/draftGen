class LinkedInExtractor {
  constructor() {
    this.data = {};
    this.isDataReady = false;
  }

  extractProfileData() {
    try {
      const data = {
        name: this.extractName(),
        headline: this.extractHeadline(),
        about: this.extractAbout(),
        experience: this.extractExperience(),
        location: this.extractLocation(),
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      this.data = data;
      this.isDataReady = true;
      
      console.log('LinkedIn data extracted:', data);
      return data;
    } catch (error) {
      console.error('Error extracting LinkedIn data:', error);
      return null;
    }
  }

  extractName() {
    const selectors = [
      'h1[data-anonymize="person-name"]',
      '.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      'h1.break-words'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  extractHeadline() {
    const selectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      '[data-anonymize="headline"]',
      '.text-body-medium:not(.break-words)'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && 
          !element.textContent.includes('connections') &&
          !element.textContent.includes('followers')) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  extractAbout() {
    const selectors = [
      '#about ~ * .pv-shared-text-with-see-more .inline-show-more-text',
      '[data-field="summary"] .pv-shared-text-with-see-more',
      '.pv-about-section .pv-shared-text-with-see-more',
      '.summary-section .pv-about-section',
      '[data-section="summary"] .inline-show-more-text'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  extractExperience() {
    const experiences = [];
    
    const experienceSelectors = [
      '.experience-section .pv-entity__summary-info',
      '.pvs-list .pvs-entity',
      '[data-field="experience"] .pv-entity__summary-info'
    ];

    for (const selector of experienceSelectors) {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        if (index >= 3) return; // Limit to first 3 experiences
        
        const titleEl = element.querySelector('.pv-entity__summary-info-v2 h3, .pvs-entity__caption-wrapper h3');
        const companyEl = element.querySelector('.pv-entity__secondary-title, .pvs-entity__caption-wrapper span');
        
        if (titleEl && companyEl) {
          experiences.push({
            title: titleEl.textContent.trim(),
            company: companyEl.textContent.trim()
          });
        }
      });
      
      if (experiences.length > 0) break;
    }
    
    return experiences;
  }

  extractLocation() {
    const selectors = [
      '.pv-text-details__left-panel .text-body-small.inline',
      '.text-body-small.inline[data-anonymize="location"]',
      '.pv-text-details__left-panel .text-body-small'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && 
          !element.textContent.includes('connections') &&
          !element.textContent.includes('Contact info')) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  formatForDisplay() {
    if (!this.isDataReady) {
      this.extractProfileData();
    }

    const { name, headline, about, experience, location } = this.data;
    
    let preview = '';
    
    if (name) preview += `${name}\n`;
    if (headline) preview += `${headline}\n`;
    if (location) preview += `${location}\n\n`;
    
    if (about) {
      const truncatedAbout = about.length > 200 ? 
        about.substring(0, 200) + '...' : about;
      preview += `About: ${truncatedAbout}\n\n`;
    }
    
    if (experience && experience.length > 0) {
      preview += 'Recent Experience:\n';
      experience.slice(0, 2).forEach(exp => {
        preview += `• ${exp.title} at ${exp.company}\n`;
      });
    }
    
    return preview.trim();
  }

  getStructuredData() {
    if (!this.isDataReady) {
      this.extractProfileData();
    }
    return this.data;
  }
}

// Initialize extractor
const linkedInExtractor = new LinkedInExtractor();

// Listen for requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractLinkedInData') {
    const data = linkedInExtractor.getStructuredData();
    const preview = linkedInExtractor.formatForDisplay();
    
    sendResponse({
      success: true,
      data: data,
      preview: preview,
      source: 'linkedin'
    });
  }
});

// Auto-extract data when page loads (for faster popup response)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => linkedInExtractor.extractProfileData(), 1000);
  });
} else {
  setTimeout(() => linkedInExtractor.extractProfileData(), 1000);
}

console.log('LinkedIn content script loaded');