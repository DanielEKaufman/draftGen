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
    this.templateSelect = document.getElementById('templateSelect')
    this.templateDescription = document.getElementById('templateDescription')
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
    this.refreshBtn = document.getElementById('refreshBtn')
    this.pullPdfBtn = document.getElementById('pullPdfBtn')
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

    // CRM elements
    this.firstName = document.getElementById('firstName')
    this.lastName = document.getElementById('lastName')
    this.contactEmail = document.getElementById('contactEmail')
    this.contactCompanyInput = document.getElementById('contactCompanyInput')
    this.contactTitleInput = document.getElementById('contactTitleInput')
    this.contactPhone = document.getElementById('contactPhone')
    this.contactLinkedIn = document.getElementById('contactLinkedIn')
    this.contactNotes = document.getElementById('contactNotes')
    this.checkCrmBtn = document.getElementById('checkCrmBtn')
    
    // Email generation toggle elements
    this.emailToggleBtn = document.getElementById('emailToggleBtn')
    this.emailGenerationContent = document.getElementById('emailGenerationContent')
    this.toggleIcon = this.emailToggleBtn.querySelector('.toggle-icon')
    this.crmStatus = document.getElementById('crmStatus')
    this.crmStatusIcon = document.getElementById('crmStatusIcon')
    this.crmStatusText = document.getElementById('crmStatusText')
    this.crmStatusDetails = document.getElementById('crmStatusDetails')
    this.contactPanel = document.getElementById('contactPanel')
    this.contactName = document.getElementById('contactName')
    this.contactEmailDisplay = document.getElementById('contactEmailDisplay')
    this.contactCompany = document.getElementById('contactCompany')
    this.contactTitle = document.getElementById('contactTitle')
    this.projectsPanel = document.getElementById('projectsPanel')
    this.projectsList = document.getElementById('projectsList')
    this.createContactPanel = document.getElementById('createContactPanel')
    this.createContactBtn = document.getElementById('createContactBtn')
    this.editContactBtn = document.getElementById('editContactBtn')
    this.createDuplicateContactBtn = document.getElementById('createDuplicateContactBtn')
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
    this.refreshBtn.addEventListener('click', () => this.refreshContent())
    this.pullPdfBtn.addEventListener('click', () => this.triggerLinkedInPDF())
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

    // Template selection change
    this.templateSelect.addEventListener('change', () => {
      this.updateTemplateDescription()
    })

    // CRM event listeners
    this.checkCrmBtn.addEventListener('click', () => this.manualCRMCheck())
    this.createContactBtn.addEventListener('click', () => this.createNewContact())
    this.editContactBtn.addEventListener('click', () => this.editContact())
    this.createDuplicateContactBtn.addEventListener('click', () => this.createNewContact())
    
    // Email generation toggle
    this.emailToggleBtn.addEventListener('click', () => this.toggleEmailGeneration())
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

      // Load templates
      await this.loadTemplates()

      // Get current tab URL for caching
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      this.currentTabUrl = tab.url

      // Check for cached data first
      const cachedState = await this.getCachedState(tab.url)

      if (cachedState) {
        console.log('Using cached state for:', tab.url)

        // Restore extracted data
        if (cachedState.extractedData) {
          this.currentData = cachedState.extractedData
          this.displayExtractedContent(cachedState.extractedData)
          this.populateIdentityFields()

          // Restore CRM data if available
          if (cachedState.crmData) {
            this.crmData = cachedState.crmData
            if (cachedState.crmData.contacts && cachedState.crmData.contacts.length > 0) {
              this.updateCRMStatus('found', cachedState.crmData.contacts.length)
            }
          }
        }

        // Restore generated email if available
        if (cachedState.generatedEmail) {
          this.displayResults(cachedState.generatedEmail)
          this.showResultsSection()
          return
        }

        this.showMainSection()
      } else {
        // No cached data, extract content from page
        await this.extractPageContent()
      }
    } catch (error) {
      console.error('Error loading state:', error)
      this.showError('Failed to initialize extension')
    }
  }

  async getStoredConfig () {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey', 'provider', 'calendarLink', 'bio', 'notionCrm'], (result) => {
        resolve(result)
      })
    })
  }

  async getCachedState (url) {
    return new Promise((resolve) => {
      const cacheKey = `pageCache_${url}`
      chrome.storage.local.get([cacheKey], (result) => {
        resolve(result[cacheKey] || null)
      })
    })
  }

  async saveCachedState (url, state) {
    return new Promise((resolve) => {
      const cacheKey = `pageCache_${url}`
      const cacheData = {
        ...state,
        timestamp: Date.now()
      }
      chrome.storage.local.set({ [cacheKey]: cacheData }, () => {
        console.log('Saved cached state for:', url)
        resolve()
      })
    })
  }

  async clearCachedState (url) {
    return new Promise((resolve) => {
      const cacheKey = `pageCache_${url}`
      chrome.storage.local.remove([cacheKey], () => {
        console.log('Cleared cached state for:', url)
        resolve()
      })
    })
  }

  async refreshContent () {
    console.log('Refreshing content...')

    // Clear cached state for current URL
    if (this.currentTabUrl) {
      await this.clearCachedState(this.currentTabUrl)
    }

    // Show loading and re-extract
    this.showLoadingSection()
    await this.extractPageContent()
  }

  async triggerLinkedInPDF () {
    console.log('Triggering LinkedIn PDF download...')

    try {
      // Disable button during operation
      this.pullPdfBtn.disabled = true
      this.pullPdfBtn.textContent = '⏳ Downloading PDF...'

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      // Send message to content script to click More → Save to PDF
      const response = await this.sendMessageToTab(tab.id, {
        action: 'triggerPdfDownload'
      }, 10000)

      if (response && response.success) {
        console.log('PDF download triggered successfully')
        this.pullPdfBtn.textContent = '✓ PDF Downloading...'

        // Listen for the download to complete
        this.setupPDFDownloadListener()
      } else {
        console.error('Failed to trigger PDF download:', response?.error)
        this.pullPdfBtn.disabled = false
        this.pullPdfBtn.textContent = '📄 Pull in Full PDF'
        alert('Could not trigger PDF download. Please try clicking "More" → "Save to PDF" manually.')
      }
    } catch (error) {
      console.error('Error triggering PDF:', error)
      this.pullPdfBtn.disabled = false
      this.pullPdfBtn.textContent = '📄 Pull in Full PDF'
      alert(`Error: ${error.message}`)
    }
  }

  setupPDFDownloadListener () {
    // This will be implemented to listen for PDF download completion
    console.log('Setting up PDF download listener...')
    // TODO: Listen for chrome.downloads.onChanged
    // TODO: Parse PDF when download completes
    // TODO: Extract contact data from PDF
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
          console.log('🔍 Attempting LinkedIn extraction with dynamic discovery...')
          response = await this.sendMessageToTab(tab.id, { action: 'extractLinkedInData' }, 15000) // Longer timeout for dynamic discovery
          console.log('LinkedIn extraction response:', response)
          
          // If we got an error response, treat it as no response for retry logic
          if (response && response.error && !response.success) {
            console.log('LinkedIn extraction failed:', response.error)
            response = null
          }
        }

        // If not LinkedIn or LinkedIn extraction failed, try generic
        if (!response || !response.success) {
          console.log('🔍 Attempting generic extraction...')
          const genericResponse = await this.sendMessageToTab(tab.id, { action: 'extractGenericData' }, 8000) // Standard timeout for generic
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

        // Populate identity fields from extracted data
        this.populateIdentityFields()

        // Save extracted data to cache
        await this.saveCachedState(tab.url, {
          extractedData: response
        })

        // Automatically search for contacts in CRM if configured
        if (this.currentConfig.notionCrm && this.currentConfig.notionCrm.apiKey) {
          await this.performCRMLookup()
        }
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

  sendMessageToTab (tabId, message, timeout = 10000) {
    return new Promise((resolve) => {
      let responseReceived = false
      
      // Set up timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (!responseReceived) {
          responseReceived = true
          console.warn(`⏰ Message timeout after ${timeout}ms for:`, message.action)
          resolve({ 
            success: false, 
            error: `Timeout: Content script did not respond within ${timeout}ms. Try refreshing the page.` 
          })
        }
      }, timeout)
      
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          // Clear timeout since we got a response
          clearTimeout(timeoutId)
          
          if (responseReceived) {
            console.warn('⚠️ Received response after timeout, ignoring')
            return
          }
          responseReceived = true
          
          try {
            // Check for Chrome runtime errors
            const lastError = chrome.runtime.lastError
            if (lastError) {
              console.error('❌ Chrome runtime error:', lastError.message || 'Unknown error')
              console.log('Failed message:', message)
              console.log('Target tab ID:', tabId)
              resolve({ 
                success: false, 
                error: `Communication error: ${lastError.message || 'Unknown error'}. Try refreshing the page.` 
              })
            } else {
              console.log('✅ Message sent successfully:', message.action, response ? 'with response' : 'no response')
              resolve(response || { success: false, error: 'No response from content script' })
            }
          } catch (callbackError) {
            console.error('❌ Error in sendMessage callback:', callbackError)
            resolve({ success: false, error: `Callback error: ${callbackError.message}` })
          }
        })
      } catch (error) {
        clearTimeout(timeoutId)
        if (!responseReceived) {
          responseReceived = true
          console.error('❌ Exception sending message:', error)
          resolve({ success: false, error: `Send error: ${error.message}` })
        }
      }
    })
  }

  displayExtractedContent (response) {
    this.contentPreview.textContent = response.preview || 'Content extracted successfully'
    this.sourceType.textContent = response.source === 'linkedin' ? 'LinkedIn' : 'Webpage'
    this.sourceType.className = `source-badge source-${response.source}`

    // Show PDF button only on LinkedIn pages
    if (response.source === 'linkedin') {
      this.pullPdfBtn.classList.remove('hidden')
    } else {
      this.pullPdfBtn.classList.add('hidden')
    }
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

        // Save generated email to cache
        const cachedState = await this.getCachedState(this.currentTabUrl)
        await this.saveCachedState(this.currentTabUrl, {
          ...cachedState,
          generatedEmail: result
        })

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
    const selectedTemplate = this.getSelectedTemplate()
    
    const crmContext = this.buildCRMContext()
    
    return {
      action: 'generateEmail',
      data: {
        extractedData: this.currentData,
        intent: this.messageIntent.value.trim(),
        template: selectedTemplate,
        crmContext: crmContext,
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

  buildCRMContext () {
    if (!this.crmData || !this.crmData.contacts || this.crmData.contacts.length === 0) {
      return null
    }

    const contact = this.crmData.contacts[0]
    const context = {
      hasContact: true,
      contact: {
        name: [contact.firstName, contact.lastName].filter(Boolean).join(' '),
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        company: contact.company,
        title: contact.title,
        linkedinUrl: contact.linkedinUrl
      },
      relationship: {
        isExistingContact: true,
        lastModified: contact.lastModified,
        notes: contact.notes
      }
    }

    if (this.crmData.projects && this.crmData.projects.length > 0) {
      context.projects = this.crmData.projects.map(project => ({
        name: project.name,
        status: project.status,
        description: project.description
      }))
      
      const activeProjects = this.crmData.projects.filter(p => 
        p.status && !['completed', 'cancelled', 'closed'].includes(p.status.toLowerCase())
      )
      
      if (activeProjects.length > 0) {
        context.activeProjects = activeProjects
        context.projectSummary = `Currently working on ${activeProjects.length} project${activeProjects.length > 1 ? 's' : ''}: ${activeProjects.map(p => p.name).join(', ')}`
      }
    }

    return context
  }

  callBackgroundService (payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(payload, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError.message)
          resolve({ 
            success: false, 
            error: `Extension error: ${chrome.runtime.lastError.message}. Try reloading the extension.` 
          })
        } else {
          resolve(response || { success: false, error: 'No response from background service' })
        }
      })
    })
  }

  displayResults (result) {
    this.subjectLine.textContent = result.subject || 'No subject generated'
    this.emailBody.innerHTML = result.body || 'No body generated'

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
      const bodyHTML = this.emailBody.innerHTML
      
      // Create clipboard data with both HTML and plain text versions
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([`<div>${bodyHTML}</div>`], { type: 'text/html' }),
        'text/plain': new Blob([`Subject: ${subject}\n\n${this.emailBody.textContent}`], { type: 'text/plain' })
      })

      await navigator.clipboard.write([clipboardItem])

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
      this.fallbackCopyWithHTML()
    }
  }

  fallbackCopyWithHTML () {
    // Try to copy HTML first using a hidden div
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = this.emailBody.innerHTML
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.contentEditable = 'true'
    
    document.body.appendChild(tempDiv)
    
    // Select the content
    const range = document.createRange()
    range.selectNodeContents(tempDiv)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    
    try {
      // Try to copy the HTML content
      document.execCommand('copy')
      console.log('HTML copied successfully via fallback')
    } catch (error) {
      console.error('HTML copy fallback failed:', error)
      // Final fallback to plain text
      this.fallbackCopy()
    } finally {
      document.body.removeChild(tempDiv)
      selection.removeAllRanges()
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

  // Template Management Methods
  async loadTemplates () {
    try {
      const result = await this.getStoredTemplates()
      const templates = result.templates || []
      
      this.populateTemplateSelect(templates)
    } catch (error) {
      console.error('Failed to load templates:', error)
      this.templateSelect.innerHTML = '<option value="">No templates available</option>'
    }
  }

  getStoredTemplates () {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['templates'], (result) => {
        resolve(result)
      })
    })
  }

  populateTemplateSelect (templates) {
    if (templates.length === 0) {
      this.templateSelect.innerHTML = '<option value="">No templates created yet</option>'
      this.templateDescription.textContent = 'Create templates in the settings page to customize your email style.'
      return
    }

    // Clear existing options
    this.templateSelect.innerHTML = ''
    
    // Add templates as options
    templates.forEach((template, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = template.name
      if (template.isDefault) {
        option.selected = true
      }
      this.templateSelect.appendChild(option)
    })

    this.currentTemplates = templates
    this.updateTemplateDescription()
  }

  updateTemplateDescription () {
    const selectedIndex = this.templateSelect.value
    
    if (selectedIndex === '' || !this.currentTemplates) {
      this.templateDescription.textContent = ''
      return
    }

    const template = this.currentTemplates[selectedIndex]
    if (template && template.description) {
      this.templateDescription.textContent = template.description
    } else {
      this.templateDescription.textContent = ''
    }
  }

  getSelectedTemplate () {
    const selectedIndex = this.templateSelect.value
    
    if (selectedIndex === '' || !this.currentTemplates) {
      return null
    }

    return this.currentTemplates[selectedIndex] || null
  }

  async searchContactsInCRM () {
    if (!this.currentConfig.notionCrm || !this.currentConfig.notionCrm.apiKey || !this.currentConfig.notionCrm.contactsDbId) {
      return {
        success: false,
        error: 'Notion CRM not configured. Please set up your Notion integration in settings.'
      }
    }

    if (!this.currentData) {
      return {
        success: false,
        error: 'No page data available for contact lookup'
      }
    }

    try {
      const searchParams = {}
      
      if (this.currentData.data) {
        const data = this.currentData.data
        
        if (data.email) {
          searchParams.email = data.email
        }
        
        if (data.firstName || data.name) {
          searchParams.firstName = data.firstName || data.name.split(' ')[0]
        }
        
        if (data.lastName) {
          searchParams.lastName = data.lastName
        } else if (data.name && data.name.includes(' ')) {
          const nameParts = data.name.split(' ')
          searchParams.lastName = nameParts[nameParts.length - 1]
        }
        
        if (data.company) {
          searchParams.company = data.company
        }
        
        if (data.linkedinUrl || data.profileUrl) {
          searchParams.linkedinUrl = data.linkedinUrl || data.profileUrl
        }
      }

      if (Object.keys(searchParams).length === 0) {
        return {
          success: false,
          error: 'No contact information found on this page for CRM lookup'
        }
      }

      console.log('Searching CRM with parameters:', searchParams)

      const result = await this.callBackgroundService({
        action: 'searchContacts',
        data: {
          notionApiKey: this.currentConfig.notionCrm.apiKey,
          contactsDbId: this.currentConfig.notionCrm.contactsDbId,
          searchParams
        }
      })

      if (result.success) {
        console.log('CRM search results:', result.contacts)
        return {
          success: true,
          contacts: result.contacts || [],
          searchParams
        }
      } else {
        return {
          success: false,
          error: result.error || 'Failed to search contacts in CRM'
        }
      }
    } catch (error) {
      console.error('Contact search error:', error)
      return {
        success: false,
        error: `Contact search failed: ${error.message}`
      }
    }
  }

  async createContactInCRM (contactData) {
    if (!this.currentConfig.notionCrm || !this.currentConfig.notionCrm.apiKey || !this.currentConfig.notionCrm.contactsDbId) {
      return {
        success: false,
        error: 'Notion CRM not configured'
      }
    }

    try {
      const result = await this.callBackgroundService({
        action: 'createContact',
        data: {
          notionApiKey: this.currentConfig.notionCrm.apiKey,
          contactsDbId: this.currentConfig.notionCrm.contactsDbId,
          contactData
        }
      })

      return result
    } catch (error) {
      console.error('Contact creation error:', error)
      return {
        success: false,
        error: `Contact creation failed: ${error.message}`
      }
    }
  }

  async getProjectsForContact (contactId) {
    if (!this.currentConfig.notionCrm || !this.currentConfig.notionCrm.projectsDbId) {
      return { success: true, projects: [] }
    }

    try {
      const result = await this.callBackgroundService({
        action: 'getProjects',
        data: {
          notionApiKey: this.currentConfig.notionCrm.apiKey,
          projectsDbId: this.currentConfig.notionCrm.projectsDbId,
          contactId
        }
      })

      return result
    } catch (error) {
      console.error('Projects lookup error:', error)
      return {
        success: false,
        error: `Projects lookup failed: ${error.message}`
      }
    }
  }

  async performCRMLookup () {
    console.log('Performing CRM lookup...')
    
    try {
      const searchResult = await this.searchContactsInCRM()
      
      if (searchResult.success) {
        console.log('CRM lookup completed:', searchResult.contacts.length, 'contacts found')
        
        this.crmData = {
          contacts: searchResult.contacts,
          searchParams: searchResult.searchParams,
          lastSearched: new Date().toISOString()
        }
        
        if (searchResult.contacts.length === 1 && this.currentConfig.notionCrm.projectsDbId) {
          const projectsResult = await this.getProjectsForContact(searchResult.contacts[0].id)
          if (projectsResult.success) {
            this.crmData.projects = projectsResult.projects
          }
        }
        
        // Show found status only if contacts were actually found
        if (searchResult.contacts.length > 0) {
          this.updateCRMStatus('found', searchResult.contacts.length)
        } else {
          this.updateCRMStatus('not_found', 0)
        }

        // Save CRM data to cache
        const cachedState = await this.getCachedState(this.currentTabUrl)
        await this.saveCachedState(this.currentTabUrl, {
          ...cachedState,
          crmData: this.crmData
        })

      } else {
        console.log('CRM lookup failed:', searchResult.error)
        this.crmData = {
          error: searchResult.error,
          lastSearched: new Date().toISOString()
        }
        
        this.updateCRMStatus('not_found', 0)
      }
    } catch (error) {
      console.error('CRM lookup error:', error)
      this.crmData = {
        error: error.message,
        lastSearched: new Date().toISOString()
      }
      
      this.updateCRMStatus('error', 0)
    }
  }

  updateCRMStatus (status, contactCount = 0) {
    console.log(`CRM Status: ${status}, Contacts: ${contactCount}`)
    console.log('CRM Data when updating status:', this.crmData)
    
    // Store status data
    this.crmStatusData = {
      status,
      contactCount,
      timestamp: new Date().toISOString()
    }

    // Update UI based on status
    this.crmStatus.classList.remove('hidden')
    
    switch (status) {
      case 'found':
        console.log('Updating UI to show contact found')
        this.crmStatusIcon.textContent = '✅'
        this.crmStatusText.textContent = `${contactCount} contact${contactCount > 1 ? 's' : ''} found in CRM`
        this.crmStatusDetails.textContent = ''
        
        if (contactCount === 1 && this.crmData && this.crmData.contacts) {
          console.log('Displaying contact info for:', this.crmData.contacts[0])
          this.displayContactInfo(this.crmData.contacts[0])
        } else if (contactCount === 0) {
          console.log('WARNING: Status is "found" but contactCount is 0!')
        }
        
        this.createContactPanel.classList.add('hidden')
        break
        
      case 'not_found':
        console.log('Setting UI to not_found - showing create contact panel')
        this.crmStatusIcon.textContent = '❌'
        this.crmStatusText.textContent = 'Contact not found in CRM'
        this.crmStatusDetails.textContent = 'You can create this contact or proceed without CRM integration'
        
        this.createContactPanel.classList.remove('hidden')
        this.contactPanel.classList.add('hidden')
        this.clearCRMIndicators() // Clear indicators when no contact found
        console.log('Create contact panel should now be visible')
        break
        
      case 'error':
        this.crmStatusIcon.textContent = '⚠️'
        this.crmStatusText.textContent = 'CRM lookup failed'
        this.crmStatusDetails.textContent = this.crmData?.error || 'Unknown error'
        
        this.contactPanel.classList.add('hidden')
        this.createContactPanel.classList.add('hidden')
        break
        
      case 'checking':
        this.crmStatusIcon.textContent = '⏳'
        this.crmStatusText.textContent = 'Checking CRM...'
        this.crmStatusDetails.textContent = ''
        
        this.contactPanel.classList.add('hidden')
        this.createContactPanel.classList.add('hidden')
        this.clearCRMIndicators() // Clear indicators when checking
        break
    }
  }

  populateIdentityFields () {
    if (!this.currentData || !this.currentData.data) {
      return
    }

    const data = this.currentData.data
    console.log('🔍 Populating identity fields with data:', data)
    
    // Parse name more intelligently with validation
    if (data.name && this.validateAsRealName(data.name)) {
      console.log('✅ Using validated full name:', data.name)
      const parsedName = this.parseFullName(data.name)
      this.firstName.value = data.firstName || parsedName.firstName || ''
      this.lastName.value = data.lastName || parsedName.lastName || ''
    } else {
      // Use individual fields if available and valid
      if (data.firstName && this.validateNamePart(data.firstName)) {
        this.firstName.value = data.firstName
      }
      if (data.lastName && this.validateNamePart(data.lastName)) {
        this.lastName.value = data.lastName
      }
      
      // If we still don't have valid names, clear the fields
      if (!this.validateNamePart(this.firstName.value) || !this.validateNamePart(this.lastName.value)) {
        console.log('❌ Invalid name data detected, clearing fields')
        this.firstName.value = ''
        this.lastName.value = ''
      }
    }
    
    if (data.email) {
      this.contactEmail.value = data.email
    }
    
    if (data.company) {
      this.contactCompanyInput.value = data.company
    }
    
    if (data.title) {
      this.contactTitleInput.value = data.title
    }
    
    if (data.phone) {
      this.contactPhone.value = data.phone
    }
    
    if (data.linkedinUrl) {
      this.contactLinkedIn.value = data.linkedinUrl
    }
  }

  validateAsRealName(text) {
    if (!text || typeof text !== 'string') return false
    
    // Extremely strict validation to prevent UI elements
    const lowercaseText = text.toLowerCase().trim()
    
    // Hard block common UI elements
    const blockedWords = ['my', 'network', 'message', 'more', 'follow', 'connect', 'linkedin', 
                         'profile', 'about', 'experience', 'education', 'home', 'notifications',
                         'jobs', 'messaging', 'premium', 'work', 'insights', 'search']
    
    // If it contains any blocked words, reject
    for (const blocked of blockedWords) {
      if (lowercaseText.includes(blocked)) {
        console.log(`❌ Rejected full name "${text}" - contains blocked word "${blocked}"`)
        return false
      }
    }
    
    // Must look like a real person's name
    if (!text.match(/^[A-Z][a-z]+ [A-Z][a-z-]+(\s+[A-Z][a-z-]+)*$/)) {
      console.log(`❌ Rejected full name "${text}" - doesn't match name pattern`)
      return false
    }
    
    // Additional length checks
    if (text.length < 6 || text.length > 50) {
      console.log(`❌ Rejected full name "${text}" - invalid length`)
      return false
    }
    
    console.log(`✅ Validated full name "${text}"`)
    return true
  }

  validateNamePart(text) {
    if (!text || typeof text !== 'string') return false
    
    const lowercaseText = text.toLowerCase().trim()
    
    // Block common UI elements
    const blockedWords = ['my', 'network', 'message', 'more', 'follow', 'connect', 'linkedin', 
                         'profile', 'about', 'experience', 'education', 'home', 'notifications']
    
    if (blockedWords.includes(lowercaseText)) {
      console.log(`❌ Rejected name part "${text}" - is blocked UI word`)
      return false
    }
    
    // Must look like a name part (starts with capital, only letters and hyphens)
    if (!text.match(/^[A-Z][a-z-]+$/)) {
      console.log(`❌ Rejected name part "${text}" - doesn't match name part pattern`)
      return false
    }
    
    // Reasonable length for a name part
    if (text.length < 2 || text.length > 25) {
      console.log(`❌ Rejected name part "${text}" - invalid length`)
      return false
    }
    
    console.log(`✅ Validated name part "${text}"`)
    return true
  }

  parseFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: '', lastName: '' }
    }

    const nameParts = fullName.trim().split(/\s+/)
    
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: '' }
    } else if (nameParts.length === 2) {
      return { firstName: nameParts[0], lastName: nameParts[1] }
    } else {
      // For names with 3+ parts, first name is first part, last name is everything else
      return { 
        firstName: nameParts[0], 
        lastName: nameParts.slice(1).join(' ') 
      }
    }
  }

  displayContactInfo (contact) {
    this.contactPanel.classList.remove('hidden')
    
    // Display in contact panel
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'N/A'
    this.contactName.textContent = fullName
    this.contactEmailDisplay.textContent = contact.email || 'N/A'
    this.contactCompany.textContent = contact.company || 'N/A'
    this.contactTitle.textContent = contact.title || 'N/A'
    
    // Populate form fields with CRM data and add visual indicators
    this.populateFieldsFromCRM(contact)
    
    if (this.crmData.projects && this.crmData.projects.length > 0) {
      this.displayProjects(this.crmData.projects)
    } else {
      this.projectsPanel.classList.add('hidden')
    }
  }

  populateFieldsFromCRM (contact) {
    console.log('Populating form fields from CRM contact:', contact)
    
    // Clear any existing CRM indicators
    this.clearCRMIndicators()
    
    // Populate fields with CRM data, prioritizing CRM data over extracted data
    if (contact.firstName) {
      this.firstName.value = contact.firstName
      this.addCRMIndicator(this.firstName, 'Found in CRM')
    }
    
    if (contact.lastName) {
      this.lastName.value = contact.lastName
      this.addCRMIndicator(this.lastName, 'Found in CRM')
    }
    
    if (contact.email) {
      this.contactEmail.value = contact.email
      this.addCRMIndicator(this.contactEmail, 'Found in CRM')
    }
    
    if (contact.company) {
      this.contactCompanyInput.value = contact.company
      this.addCRMIndicator(this.contactCompanyInput, 'Found in CRM')
    }
    
    if (contact.title) {
      this.contactTitleInput.value = contact.title
      this.addCRMIndicator(this.contactTitleInput, 'Found in CRM')
    }
    
    if (contact.phone) {
      this.contactPhone.value = contact.phone
      this.addCRMIndicator(this.contactPhone, 'Found in CRM')
    }
    
    if (contact.linkedinUrl) {
      this.contactLinkedIn.value = contact.linkedinUrl
      this.addCRMIndicator(this.contactLinkedIn, 'Found in CRM')
    }
    
    if (contact.notes) {
      this.contactNotes.value = contact.notes
      this.addCRMIndicator(this.contactNotes, 'Found in CRM')
    }
  }

  addCRMIndicator (inputElement, tooltipText) {
    // Add CSS class for visual styling
    inputElement.classList.add('crm-matched')
    
    // Add tooltip/title for hover information
    inputElement.title = tooltipText
    
    // Add visual icon after the input
    const indicator = document.createElement('span')
    indicator.className = 'crm-indicator'
    indicator.textContent = '✓'
    indicator.title = tooltipText
    
    // Insert indicator after the input
    if (inputElement.parentElement) {
      inputElement.parentElement.appendChild(indicator)
    }
  }

  clearCRMIndicators () {
    // Remove all CRM indicators and styling
    const inputs = [
      this.firstName, this.lastName, this.contactEmail, 
      this.contactCompanyInput, this.contactTitleInput, 
      this.contactPhone, this.contactLinkedIn, this.contactNotes
    ]
    
    inputs.forEach(input => {
      if (input) {
        input.classList.remove('crm-matched')
        input.removeAttribute('title')
      }
    })
    
    // Remove indicator elements
    document.querySelectorAll('.crm-indicator').forEach(indicator => {
      indicator.remove()
    })
  }

  displayProjects (projects) {
    this.projectsPanel.classList.remove('hidden')
    
    this.projectsList.innerHTML = projects.map(project => `
      <div class="project-item">
        <div class="project-name">${project.name || 'Untitled Project'}</div>
        <div class="project-status">${project.status || 'Unknown'}</div>
        ${project.description ? `<div class="project-description">${project.description}</div>` : ''}
      </div>
    `).join('')
  }

  async manualCRMCheck () {
    console.log('Manual CRM check started')
    console.log('Current config:', this.currentConfig)
    
    // Validate CRM configuration first
    if (!this.currentConfig || !this.currentConfig.notionCrm || !this.currentConfig.notionCrm.apiKey || !this.currentConfig.notionCrm.contactsDbId) {
      console.log('CRM not configured, showing error')
      this.updateCRMStatus('error')
      this.crmData = { error: 'Notion CRM not configured. Please set up your Notion integration in settings.' }
      return
    }

    this.updateCRMStatus('checking')
    this.checkCrmBtn.disabled = true
    this.checkCrmBtn.querySelector('.btn-text').textContent = 'Checking...'
    this.checkCrmBtn.querySelector('.btn-spinner').classList.remove('hidden')
    
    try {
      const searchParams = {}
      
      // Only include high-confidence search parameters (email and LinkedIn URL)
      const email = this.contactEmail.value.trim()
      const linkedinUrl = this.contactLinkedIn.value.trim()
      
      if (email) {
        searchParams.email = email
        console.log('Manual search: Using email:', email)
      }
      
      if (linkedinUrl) {
        searchParams.linkedinUrl = linkedinUrl
        console.log('Manual search: Using LinkedIn URL:', linkedinUrl)
      }
      
      // Add names for debugging purposes (not used in actual search but helpful for logging)
      const firstName = this.firstName.value.trim()
      const lastName = this.lastName.value.trim()
      if (firstName) searchParams.firstName = firstName
      if (lastName) searchParams.lastName = lastName
      
      console.log('Manual CRM search parameters:', searchParams)
      
      if (!email && !linkedinUrl) {
        this.updateCRMStatus('error')
        this.crmData = { error: 'Please provide either an email address or LinkedIn URL for accurate contact matching' }
        return
      }
      
      const result = await this.callBackgroundService({
        action: 'searchContacts',
        data: {
          notionApiKey: this.currentConfig.notionCrm.apiKey,
          contactsDbId: this.currentConfig.notionCrm.contactsDbId,
          searchParams
        }
      })
      
      console.log('Manual CRM check result:', result)
      
      if (result.success) {
        console.log('Manual CRM check successful!')
        console.log('Contacts found:', result.contacts?.length || 0)
        console.log('Contacts data:', result.contacts)
        
        this.crmData = {
          contacts: result.contacts || [],
          searchParams,
          lastSearched: new Date().toISOString()
        }
        
        const contactCount = result.contacts?.length || 0
        console.log('Setting CRM status based on contact count:', contactCount)
        
        if (contactCount === 1 && this.currentConfig.notionCrm.projectsDbId) {
          const projectsResult = await this.getProjectsForContact(result.contacts[0].id)
          if (projectsResult.success) {
            this.crmData.projects = projectsResult.projects
          }
        }
        
        // Show found status only if contacts were actually found
        if (contactCount > 0) {
          this.updateCRMStatus('found', contactCount)
        } else {
          this.updateCRMStatus('not_found', 0)
        }
      } else {
        console.log('Manual CRM check failed:', result.error)
        this.crmData = { error: result.error }
        this.updateCRMStatus('not_found')
        console.log('Should show create contact panel now')
      }
    } catch (error) {
      console.error('Manual CRM check error:', error)
      this.crmData = { error: error.message }
      this.updateCRMStatus('error')
    } finally {
      this.checkCrmBtn.disabled = false
      this.checkCrmBtn.querySelector('.btn-text').textContent = 'Check CRM'
      this.checkCrmBtn.querySelector('.btn-spinner').classList.add('hidden')
    }
  }

  async createNewContact () {
    const contactData = {
      firstName: this.firstName.value.trim(),
      lastName: this.lastName.value.trim(),
      email: this.contactEmail.value.trim(),
      company: this.contactCompanyInput.value.trim(),
      title: this.contactTitleInput.value.trim(),
      phone: this.contactPhone.value.trim(),
      linkedinUrl: this.contactLinkedIn.value.trim(),
      notes: this.contactNotes.value.trim()
    }
    
    // LinkedIn URL is now captured directly from the form field
    
    // Remove empty fields to avoid sending empty strings
    Object.keys(contactData).forEach(key => {
      if (!contactData[key]) {
        delete contactData[key]
      }
    })
    
    try {
      const result = await this.createContactInCRM(contactData)
      
      if (result.success) {
        this.crmData = {
          contacts: [result.contact],
          searchParams: contactData,
          lastSearched: new Date().toISOString()
        }
        
        this.updateCRMStatus('found', 1)
        alert('Contact created successfully in CRM!')
      } else {
        alert(`Failed to create contact: ${result.error}`)
      }
    } catch (error) {
      console.error('Contact creation error:', error)
      alert(`Error creating contact: ${error.message}`)
    }
  }

  editContact () {
    this.firstName.focus()
    alert('Edit the identity fields above and click "Check CRM" to update.')
  }

  toggleEmailGeneration () {
    const isExpanded = !this.emailGenerationContent.classList.contains('hidden')
    
    if (isExpanded) {
      // Collapse
      this.emailGenerationContent.classList.add('hidden')
      this.toggleIcon.textContent = '▶'
    } else {
      // Expand
      this.emailGenerationContent.classList.remove('hidden')
      this.toggleIcon.textContent = '▼'
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController()
})
