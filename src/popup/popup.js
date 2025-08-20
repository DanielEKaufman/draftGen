class PopupController {
  constructor () {
    this.currentData = null
    this.currentConfig = null
    this.initializeElements()
    this.attachEventListeners()
    this.loadState()
  }

  initializeElements () {
    // Sections
    this.loadingSection = document.getElementById('loadingSection')
    this.errorSection = document.getElementById('errorSection')
    this.mainSection = document.getElementById('mainSection')
    this.resultsSection = document.getElementById('resultsSection')
    this.configSection = document.getElementById('configSection')

    // Main section elements
    this.contentPreview = document.getElementById('contentPreview')
    this.sourceType = document.getElementById('sourceType')
    this.messageIntent = document.getElementById('messageIntent')
    this.charCount = document.getElementById('charCount')

    // Rule checkboxes
    this.maxSentences = document.getElementById('maxSentences')
    this.maxParagraphs = document.getElementById('maxParagraphs')
    this.noEmDashes = document.getElementById('noEmDashes')
    this.includeCalendar = document.getElementById('includeCalendar')
    this.includeBio = document.getElementById('includeBio')

    // Buttons
    this.generateBtn = document.getElementById('generateBtn')
    this.retryBtn = document.getElementById('retryBtn')
    this.optionsBtn = document.getElementById('optionsBtn')
    this.openOptionsBtn = document.getElementById('openOptionsBtn')
    this.backBtn = document.getElementById('backBtn')
    this.copyBtn = document.getElementById('copyBtn')
    this.regenerateBtn = document.getElementById('regenerateBtn')

    // Results elements
    this.subjectLine = document.getElementById('subjectLine')
    this.emailBody = document.getElementById('emailBody')
    this.sentenceCount = document.getElementById('sentenceCount')
    this.paragraphCount = document.getElementById('paragraphCount')
    this.wordCount = document.getElementById('wordCount')

    // Error elements
    this.errorMessage = document.getElementById('errorMessage')
  }

  attachEventListeners () {
    // Character count for intent textarea
    this.messageIntent.addEventListener('input', () => {
      const count = this.messageIntent.value.length
      this.charCount.textContent = count

      if (count > 180) {
        this.charCount.style.color = '#e74c3c'
      } else {
        this.charCount.style.color = '#666'
      }
    })

    // Generate button
    this.generateBtn.addEventListener('click', () => this.generateEmail())

    // Navigation buttons
    this.retryBtn.addEventListener('click', () => this.loadState())
    this.backBtn.addEventListener('click', () => this.showMainSection())
    this.regenerateBtn.addEventListener('click', () => this.showMainSection())

    // Options buttons
    this.optionsBtn.addEventListener('click', () => this.openOptions())
    this.openOptionsBtn.addEventListener('click', () => this.openOptions())

    // Copy button
    this.copyBtn.addEventListener('click', () => this.copyToClipboard())

    // Enter key in textarea
    this.messageIntent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.generateEmail()
      }
    })
  }

  async loadState () {
    this.showLoadingSection()

    try {
      // Check if configuration exists
      const config = await this.getStoredConfig()
      if (!config || !config.apiKey) {
        this.showConfigSection()
        return
      }

      this.currentConfig = config

      // Load checkbox states from storage
      this.loadCheckboxStates()

      // Extract content from current page
      await this.extractPageContent()
    } catch (error) {
      console.error('Error loading state:', error)
      this.showError('Failed to initialize extension')
    }
  }

  async getStoredConfig () {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey', 'provider', 'calendarLink', 'bio'], (result) => {
        resolve(result)
      })
    })
  }

  loadCheckboxStates () {
    chrome.storage.local.get(['checkboxStates'], (result) => {
      const states = result.checkboxStates || {}

      // Set defaults if not stored
      const defaults = {
        maxSentences: true,
        maxParagraphs: true,
        noEmDashes: true,
        includeCalendar: !!this.currentConfig.calendarLink,
        includeBio: !!this.currentConfig.bio
      }

      Object.keys(defaults).forEach(key => {
        const checkbox = document.getElementById(key)
        if (checkbox) {
          checkbox.checked = states[key] !== undefined ? states[key] : defaults[key]
        }
      })
    })
  }

  saveCheckboxStates () {
    const states = {
      maxSentences: this.maxSentences.checked,
      maxParagraphs: this.maxParagraphs.checked,
      noEmDashes: this.noEmDashes.checked,
      includeCalendar: this.includeCalendar.checked,
      includeBio: this.includeBio.checked
    }

    chrome.storage.local.set({ checkboxStates: states })
  }

  async extractPageContent () {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      console.log('Current tab:', tab.url)

      // Check if the page URL is supported
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.showError('Cannot extract content from this type of page. Try visiting a LinkedIn profile or website.')
        return
      }

      // Wait longer for content scripts to load
      await new Promise(resolve => setTimeout(resolve, 1500))

      let response = null
      let attempts = 0
      const maxAttempts = 3

      // Retry mechanism for content script communication
      while (!response && attempts < maxAttempts) {
        attempts++
        console.log(`Extraction attempt ${attempts}/${maxAttempts}`)

        // Try LinkedIn first if it's a LinkedIn URL
        if (tab.url.includes('linkedin.com')) {
          response = await this.sendMessageToTab(tab.id, { action: 'extractLinkedInData' })
          console.log('LinkedIn extraction response:', response)
          
          // If we got an error response, treat it as no response for retry logic
          if (response && response.error && !response.success) {
            console.log('LinkedIn extraction failed:', response.error)
            response = null
          }
        }

        // If not LinkedIn or LinkedIn extraction failed, try generic
        if (!response || !response.success) {
          const genericResponse = await this.sendMessageToTab(tab.id, { action: 'extractGenericData' })
          console.log('Generic extraction response:', genericResponse)
          
          // Only use generic response if it's actually successful
          if (genericResponse && genericResponse.success) {
            response = genericResponse
          } else if (genericResponse && genericResponse.error) {
            console.log('Generic extraction failed:', genericResponse.error)
          }
        }

        // If still no response, wait before retrying
        if (!response && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (response && response.success) {
        this.currentData = response
        this.displayExtractedContent(response)
        this.showMainSection()
      } else if (response && response.debug) {
        console.log('Debug info:', response.debug)
        this.showError(`No content could be extracted from this page.\nURL: ${tab.url}\nDebug: ${JSON.stringify(response.debug, null, 2)}\n\nTry visiting a LinkedIn profile or a webpage with meaningful content.`)
      } else {
        this.showError(`No content could be extracted from this page.\nURL: ${tab.url}\n\nPossible issues:\n• Content scripts not loaded\n• Page blocked by CORS\n• Insufficient page content\n\nTry refreshing the page and reopening the extension.`)
      }
    } catch (error) {
      console.error('Error extracting content:', error)
      this.showError(`Failed to extract content: ${error.message}`)
    }
  }

  sendMessageToTab (tabId, message) {
    return new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          // Check for Chrome runtime errors
          const lastError = chrome.runtime.lastError
          if (lastError) {
            console.error('Chrome runtime error:', lastError.message || 'Unknown error')
            console.log('Failed message:', message)
            console.log('Target tab ID:', tabId)
            resolve({ success: false, error: lastError.message || 'Communication error' })
          } else {
            console.log('Message sent successfully:', message.action, response)
            resolve(response || { success: false, error: 'No response from content script' })
          }
        })
      } catch (error) {
        console.error('Exception sending message:', error)
        resolve({ success: false, error: error.message })
      }
    })
  }

  displayExtractedContent (response) {
    this.contentPreview.textContent = response.preview || 'Content extracted successfully'
    this.sourceType.textContent = response.source === 'linkedin' ? 'LinkedIn' : 'Webpage'
    this.sourceType.className = `source-badge source-${response.source}`
  }

  async generateEmail () {
    if (!this.messageIntent.value.trim()) {
      this.messageIntent.focus()
      this.messageIntent.style.borderColor = '#e74c3c'
      setTimeout(() => {
        this.messageIntent.style.borderColor = '#ddd'
      }, 2000)
      return
    }

    this.saveCheckboxStates()
    this.showGeneratingState()

    try {
      const payload = this.buildGenerationPayload()
      const result = await this.callBackgroundService(payload)

      if (result.success) {
        this.displayResults(result)
        this.showResultsSection()
      } else {
        this.showError(result.error || 'Failed to generate email')
      }
    } catch (error) {
      console.error('Generation error:', error)
      this.showError('Failed to generate email. Please check your API key and try again.')
    }
  }

  buildGenerationPayload () {
    return {
      action: 'generateEmail',
      data: {
        extractedData: this.currentData,
        intent: this.messageIntent.value.trim(),
        rules: {
          maxSentences: this.maxSentences.checked,
          maxParagraphs: this.maxParagraphs.checked,
          noEmDashes: this.noEmDashes.checked
        },
        placeholders: {
          calendarLink: this.includeCalendar.checked ? this.currentConfig.calendarLink : null,
          bio: this.includeBio.checked ? this.currentConfig.bio : null
        },
        config: this.currentConfig
      }
    }
  }

  callBackgroundService (payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(payload, (response) => {
        resolve(response || { success: false, error: 'No response from background service' })
      })
    })
  }

  displayResults (result) {
    this.subjectLine.textContent = result.subject || 'No subject generated'
    this.emailBody.textContent = result.body || 'No body generated'

    // Update stats
    const sentences = this.countSentences(result.body)
    const paragraphs = this.countParagraphs(result.body)
    const words = this.countWords(result.body)

    this.sentenceCount.textContent = sentences
    this.paragraphCount.textContent = paragraphs
    this.wordCount.textContent = words
  }

  countSentences (text) {
    if (!text) return 0
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  }

  countParagraphs (text) {
    if (!text) return 0
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  }

  countWords (text) {
    if (!text) return 0
    return text.split(/\s+/).filter(w => w.length > 0).length
  }

  async copyToClipboard () {
    try {
      const subject = this.subjectLine.textContent
      const body = this.emailBody.textContent
      const fullText = `Subject: ${subject}\n\n${body}`

      await navigator.clipboard.writeText(fullText)

      // Show success state
      const btnText = this.copyBtn.querySelector('.btn-text')
      const btnSuccess = this.copyBtn.querySelector('.btn-success')

      btnText.classList.add('hidden')
      btnSuccess.classList.remove('hidden')

      setTimeout(() => {
        btnText.classList.remove('hidden')
        btnSuccess.classList.add('hidden')
      }, 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      // Fallback for older browsers
      this.fallbackCopy()
    }
  }

  fallbackCopy () {
    const subject = this.subjectLine.textContent
    const body = this.emailBody.textContent
    const fullText = `Subject: ${subject}\n\n${body}`

    const textArea = document.createElement('textarea')
    textArea.value = fullText
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  openOptions () {
    chrome.runtime.openOptionsPage()
  }

  // UI State Methods
  showSection (section) {
    [this.loadingSection, this.errorSection, this.mainSection,
      this.resultsSection, this.configSection].forEach(s => {
      s.classList.add('hidden')
    })
    section.classList.remove('hidden')
  }

  showLoadingSection () {
    this.showSection(this.loadingSection)
  }

  showMainSection () {
    this.showSection(this.mainSection)
  }

  showResultsSection () {
    this.showSection(this.resultsSection)
  }

  showConfigSection () {
    this.showSection(this.configSection)
  }

  showError (message) {
    this.errorMessage.textContent = message
    this.showSection(this.errorSection)
  }

  showGeneratingState () {
    this.generateBtn.disabled = true
    this.generateBtn.querySelector('.btn-text').textContent = 'Generating...'
    this.generateBtn.querySelector('.btn-spinner').classList.remove('hidden')
  }

  resetGenerateButton () {
    this.generateBtn.disabled = false
    this.generateBtn.querySelector('.btn-text').textContent = 'Generate Email'
    this.generateBtn.querySelector('.btn-spinner').classList.add('hidden')
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController()
})
