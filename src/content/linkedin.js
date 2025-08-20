// Prevent redeclaration if script is loaded multiple times
if (typeof window.LinkedInExtractor === 'undefined') {
  class LinkedInExtractor {
    constructor () {
      this.data = {}
      this.isDataReady = false
    }

    extractProfileData () {
      try {
        console.log('Starting LinkedIn data extraction on URL:', window.location.href)
        
        const data = {
          name: this.extractName(),
          headline: this.extractHeadline(),
          about: this.extractAbout(),
          experience: this.extractExperience(),
          location: this.extractLocation(),
          url: window.location.href,
          timestamp: new Date().toISOString()
        }

        this.data = data
        this.isDataReady = true

        console.log('LinkedIn data extracted:', data)
        
        // Check if we got meaningful data
        const hasContent = data.name || data.headline || data.about || (data.experience && data.experience.length > 0)
        console.log('Has meaningful content:', hasContent)
        
        return data
      } catch (error) {
        console.error('Error extracting LinkedIn data:', error)
        return null
      }
    }

    extractName () {
      const selectors = [
        'h1[data-anonymize="person-name"]',
        '.text-heading-xlarge',
        '.pv-text-details__left-panel h1',
        'h1.break-words',
        '.pv-top-card--list h1',
        '.text-heading-xlarge.inline.t-24.v-align-middle.break-words',
        'main h1'
      ]

      for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (element && element.textContent.trim()) {
          console.log(`Found name using selector: ${selector}`, element.textContent.trim())
          return element.textContent.trim()
        }
      }
      
      // Fallback - try any h1 on the page that looks like a name
      const h1Elements = document.querySelectorAll('h1')
      for (const h1 of h1Elements) {
        const text = h1.textContent.trim()
        if (text && text.length > 3 && text.length < 100 && !text.toLowerCase().includes('linkedin')) {
          console.log('Found name via h1 fallback:', text)
          return text
        }
      }
      
      return ''
    }

    extractHeadline () {
      const selectors = [
        '.text-body-medium.break-words',
        '.pv-text-details__left-panel .text-body-medium',
        '[data-anonymize="headline"]',
        '.text-body-medium:not(.break-words)',
        '.pv-top-card--list-bullet .text-body-medium',
        'main section .text-body-medium'
      ]

      for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (element && element.textContent.trim() &&
          !element.textContent.includes('connections') &&
          !element.textContent.includes('followers') &&
          !element.textContent.includes('mutual connections')) {
          console.log(`Found headline using selector: ${selector}`, element.textContent.trim())
          return element.textContent.trim()
        }
      }
      
      // Fallback - look for text that looks like a headline near the name
      const bodyMediumElements = document.querySelectorAll('.text-body-medium')
      for (const element of bodyMediumElements) {
        const text = element.textContent.trim()
        if (text && text.length > 10 && text.length < 200 && 
            !text.includes('connections') && 
            !text.includes('followers') &&
            !text.includes('mutual') &&
            (text.includes('at') || text.includes('|') || text.includes('•'))) {
          console.log('Found headline via fallback:', text)
          return text
        }
      }
      
      return ''
    }

    extractAbout () {
      const selectors = [
        '#about ~ * .pv-shared-text-with-see-more .inline-show-more-text',
        '[data-field="summary"] .pv-shared-text-with-see-more',
        '.pv-about-section .pv-shared-text-with-see-more',
        '.summary-section .pv-about-section',
        '[data-section="summary"] .inline-show-more-text'
      ]

      for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (element && element.textContent.trim()) {
          return element.textContent.trim()
        }
      }
      return ''
    }

    extractExperience () {
      const experiences = []

      const experienceSelectors = [
        '.experience-section .pv-entity__summary-info',
        '.pvs-list .pvs-entity',
        '[data-field="experience"] .pv-entity__summary-info'
      ]

      for (const selector of experienceSelectors) {
        const elements = document.querySelectorAll(selector)

        elements.forEach((element, index) => {
          if (index >= 3) return // Limit to first 3 experiences

          const titleEl = element.querySelector('.pv-entity__summary-info-v2 h3, .pvs-entity__caption-wrapper h3')
          const companyEl = element.querySelector('.pv-entity__secondary-title, .pvs-entity__caption-wrapper span')

          if (titleEl && companyEl) {
            experiences.push({
              title: titleEl.textContent.trim(),
              company: companyEl.textContent.trim()
            })
          }
        })

        if (experiences.length > 0) break
      }

      return experiences
    }

    extractLocation () {
      const selectors = [
        '.pv-text-details__left-panel .text-body-small.inline',
        '.text-body-small.inline[data-anonymize="location"]',
        '.pv-text-details__left-panel .text-body-small'
      ]

      for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (element && element.textContent.trim() &&
          !element.textContent.includes('connections') &&
          !element.textContent.includes('Contact info')) {
          return element.textContent.trim()
        }
      }
      return ''
    }

    formatForDisplay () {
      if (!this.isDataReady) {
        this.extractProfileData()
      }

      const { name, headline, about, experience, location } = this.data

      let preview = ''

      if (name) preview += `${name}\n`
      if (headline) preview += `${headline}\n`
      if (location) preview += `${location}\n\n`

      if (about) {
        const truncatedAbout = about.length > 200
          ? about.substring(0, 200) + '...'
          : about
        preview += `About: ${truncatedAbout}\n\n`
      }

      if (experience && experience.length > 0) {
        preview += 'Recent Experience:\n'
        experience.slice(0, 2).forEach(exp => {
          preview += `• ${exp.title} at ${exp.company}\n`
        })
      }

      return preview.trim()
    }

    getStructuredData () {
      if (!this.isDataReady) {
        this.extractProfileData()
      }
      return this.data
    }
  }

  // Initialize extractor
  window.LinkedInExtractor = LinkedInExtractor
  const linkedInExtractor = new LinkedInExtractor()

  // Listen for requests from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('LinkedIn content script received message:', request)

    if (request.action === 'extractLinkedInData') {
      try {
        // Force fresh extraction
        const data = linkedInExtractor.extractProfileData()
        const preview = linkedInExtractor.formatForDisplay()

        console.log('LinkedIn extraction results:', { data, preview })

        // More lenient content checking
        const hasName = data && data.name && data.name.length > 0
        const hasHeadline = data && data.headline && data.headline.length > 0
        const hasAnyContent = hasName || hasHeadline || (data && data.about) || (data && data.experience && data.experience.length > 0)

        console.log('Content check:', { hasName, hasHeadline, hasAnyContent, previewLength: preview ? preview.length : 0 })

        sendResponse({
          success: hasAnyContent,
          data: data || {},
          preview: preview || 'No content extracted',
          source: 'linkedin',
          debug: {
            hasName,
            hasHeadline,
            url: window.location.href,
            dataKeys: data ? Object.keys(data) : []
          }
        })
      } catch (error) {
        console.error('LinkedIn extraction error:', error)
        sendResponse({ 
          success: false, 
          error: error.message,
          data: {},
          preview: 'Error: ' + error.message,
          source: 'linkedin'
        })
      }
    }

    return true // Keep message channel open for async response
  })

  // Auto-extract data when page loads (for faster popup response)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => linkedInExtractor.extractProfileData(), 1000)
    })
  } else {
    setTimeout(() => linkedInExtractor.extractProfileData(), 1000)
  }
} else {
  console.log('LinkedIn extractor already loaded - reusing existing instance')
}

console.log('LinkedIn content script loaded')
