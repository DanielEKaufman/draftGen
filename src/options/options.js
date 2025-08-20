class OptionsController {
  constructor () {
    this.initializeElements()
    this.attachEventListeners()
    this.loadSettings()
  }

  initializeElements () {
    // Provider selection
    this.providerRadios = document.querySelectorAll('input[name="provider"]')
    this.anthropicHelp = document.getElementById('anthropicHelp')
    this.openaiHelp = document.getElementById('openaiHelp')

    // API settings
    this.apiKey = document.getElementById('apiKey')
    this.toggleApiKey = document.getElementById('toggleApiKey')
    this.testApiBtn = document.getElementById('testApiBtn')
    this.apiTestResult = document.getElementById('apiTestResult')

    // Personal info
    this.calendarLink = document.getElementById('calendarLink')
    this.bio = document.getElementById('bio')
    this.bioCharCount = document.getElementById('bioCharCount')

    // Preferences
    this.defaultMaxSentences = document.getElementById('defaultMaxSentences')
    this.defaultMaxParagraphs = document.getElementById('defaultMaxParagraphs')
    this.defaultNoEmDashes = document.getElementById('defaultNoEmDashes')

    // Advanced
    this.model = document.getElementById('model')
    this.debugMode = document.getElementById('debugMode')

    // Actions
    this.saveBtn = document.getElementById('saveBtn')
    this.resetBtn = document.getElementById('resetBtn')

    // Status
    this.statusMessage = document.getElementById('statusMessage')
  }

  attachEventListeners () {
    // Provider change
    this.providerRadios.forEach(radio => {
      radio.addEventListener('change', () => this.updateProviderHelp())
    })

    // API key toggle
    this.toggleApiKey.addEventListener('click', () => this.toggleApiKeyVisibility())

    // Bio character count
    this.bio.addEventListener('input', () => this.updateBioCharCount())

    // Test API
    this.testApiBtn.addEventListener('click', () => this.testApiConnection())

    // Save and reset
    this.saveBtn.addEventListener('click', () => this.saveSettings())
    this.resetBtn.addEventListener('click', () => this.resetSettings())

    // Status message close
    const statusClose = this.statusMessage.querySelector('.status-close')
    statusClose.addEventListener('click', () => this.hideStatusMessage())

    // Auto-hide status message
    this.statusMessage.addEventListener('click', (e) => {
      if (e.target === this.statusMessage) {
        this.hideStatusMessage()
      }
    })

    // Model selection based on provider
    this.providerRadios.forEach(radio => {
      radio.addEventListener('change', () => this.updateModelOptions())
    })
  }

  updateProviderHelp () {
    const selectedProvider = document.querySelector('input[name="provider"]:checked').value

    if (selectedProvider === 'anthropic') {
      this.anthropicHelp.classList.remove('hidden')
      this.openaiHelp.classList.add('hidden')
    } else {
      this.anthropicHelp.classList.add('hidden')
      this.openaiHelp.classList.remove('hidden')
    }

    this.updateModelOptions()
    this.clearApiTestResult()
  }

  updateModelOptions () {
    const selectedProvider = document.querySelector('input[name="provider"]:checked').value
    const modelSelect = this.model

    // Clear existing options except default
    while (modelSelect.children.length > 1) {
      modelSelect.removeChild(modelSelect.lastChild)
    }

    // Add provider-specific options
    if (selectedProvider === 'anthropic') {
      const options = [
        { value: 'claude-3-sonnet-20240229', text: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku-20240307', text: 'Claude 3 Haiku' }
      ]
      options.forEach(opt => {
        const option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.text
        modelSelect.appendChild(option)
      })
    } else {
      const options = [
        { value: 'gpt-4o', text: 'GPT-4o' },
        { value: 'gpt-4o-mini', text: 'GPT-4o Mini' }
      ]
      options.forEach(opt => {
        const option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.text
        modelSelect.appendChild(option)
      })
    }
  }

  toggleApiKeyVisibility () {
    const isPassword = this.apiKey.type === 'password'
    this.apiKey.type = isPassword ? 'text' : 'password'
    this.toggleApiKey.textContent = isPassword ? '🙈' : '👁️'
  }

  updateBioCharCount () {
    const count = this.bio.value.length
    this.bioCharCount.textContent = count

    if (count > 130) {
      this.bioCharCount.style.color = '#e74c3c'
    } else if (count > 100) {
      this.bioCharCount.style.color = '#f39c12'
    } else {
      this.bioCharCount.style.color = '#666'
    }
  }

  async testApiConnection () {
    const apiKey = this.apiKey.value.trim()
    const provider = document.querySelector('input[name="provider"]:checked').value

    if (!apiKey) {
      this.showApiTestResult('Please enter an API key first', 'error')
      return
    }

    this.showTestingState()

    try {
      const result = await this.callBackgroundService({
        action: 'testApiConnection',
        data: { apiKey, provider }
      })

      if (result.success) {
        this.showApiTestResult('✅ API connection successful!', 'success')
      } else {
        this.showApiTestResult(`❌ ${result.error || 'API test failed'}`, 'error')
      }
    } catch (error) {
      this.showApiTestResult(`❌ Connection failed: ${error.message}`, 'error')
    } finally {
      this.resetTestButton()
    }
  }

  callBackgroundService (payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(payload, (response) => {
        resolve(response || { success: false, error: 'No response from background service' })
      })
    })
  }

  showTestingState () {
    this.testApiBtn.disabled = true
    this.testApiBtn.querySelector('.btn-text').textContent = 'Testing...'
    this.testApiBtn.querySelector('.btn-spinner').classList.remove('hidden')
    this.clearApiTestResult()
  }

  resetTestButton () {
    this.testApiBtn.disabled = false
    this.testApiBtn.querySelector('.btn-text').textContent = 'Test API Connection'
    this.testApiBtn.querySelector('.btn-spinner').classList.add('hidden')
  }

  showApiTestResult (message, type) {
    this.apiTestResult.textContent = message
    this.apiTestResult.className = `test-result ${type}`
    this.apiTestResult.classList.remove('hidden')
  }

  clearApiTestResult () {
    this.apiTestResult.classList.add('hidden')
  }

  async saveSettings () {
    this.showSavingState()

    try {
      const settings = this.gatherSettings()

      // Validate required fields
      if (!settings.apiKey) {
        this.showStatusMessage('Please enter an API key', 'error')
        return
      }

      // Validate calendar link if provided
      if (settings.calendarLink && !this.isValidUrl(settings.calendarLink)) {
        this.showStatusMessage('Please enter a valid calendar URL', 'error')
        return
      }

      // Save to Chrome storage
      await this.saveToStorage(settings)

      this.showStatusMessage('Settings saved successfully!', 'success')
    } catch (error) {
      console.error('Save error:', error)
      this.showStatusMessage('Failed to save settings', 'error')
    } finally {
      this.resetSaveButton()
    }
  }

  gatherSettings () {
    return {
      provider: document.querySelector('input[name="provider"]:checked').value,
      apiKey: this.apiKey.value.trim(),
      calendarLink: this.calendarLink.value.trim(),
      bio: this.bio.value.trim(),
      model: this.model.value,
      debugMode: this.debugMode.checked,
      defaultPreferences: {
        maxSentences: this.defaultMaxSentences.checked,
        maxParagraphs: this.defaultMaxParagraphs.checked,
        noEmDashes: this.defaultNoEmDashes.checked
      }
    }
  }

  isValidUrl (string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  saveToStorage (settings) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  async loadSettings () {
    try {
      const settings = await this.loadFromStorage()
      this.populateForm(settings)
    } catch (error) {
      console.error('Load error:', error)
      this.showStatusMessage('Failed to load settings', 'error')
    }
  }

  loadFromStorage () {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'provider', 'apiKey', 'calendarLink', 'bio', 'model', 'debugMode', 'defaultPreferences'
      ], (result) => {
        resolve(result)
      })
    })
  }

  populateForm (settings) {
    // Provider
    if (settings.provider) {
      const providerRadio = document.querySelector(`input[name="provider"][value="${settings.provider}"]`)
      if (providerRadio) {
        providerRadio.checked = true
        this.updateProviderHelp()
      }
    }

    // API key
    if (settings.apiKey) {
      this.apiKey.value = settings.apiKey
    }

    // Personal info
    if (settings.calendarLink) {
      this.calendarLink.value = settings.calendarLink
    }
    if (settings.bio) {
      this.bio.value = settings.bio
      this.updateBioCharCount()
    }

    // Advanced
    if (settings.model) {
      this.model.value = settings.model
    }
    if (settings.debugMode !== undefined) {
      this.debugMode.checked = settings.debugMode
    }

    // Default preferences
    if (settings.defaultPreferences) {
      const prefs = settings.defaultPreferences
      if (prefs.maxSentences !== undefined) {
        this.defaultMaxSentences.checked = prefs.maxSentences
      }
      if (prefs.maxParagraphs !== undefined) {
        this.defaultMaxParagraphs.checked = prefs.maxParagraphs
      }
      if (prefs.noEmDashes !== undefined) {
        this.defaultNoEmDashes.checked = prefs.noEmDashes
      }
    }
  }

  resetSettings () {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      // Reset form to defaults
      document.querySelector('input[name="provider"][value="anthropic"]').checked = true
      this.apiKey.value = ''
      this.calendarLink.value = ''
      this.bio.value = ''
      this.model.value = ''
      this.debugMode.checked = false
      this.defaultMaxSentences.checked = true
      this.defaultMaxParagraphs.checked = true
      this.defaultNoEmDashes.checked = true

      this.updateProviderHelp()
      this.updateBioCharCount()
      this.clearApiTestResult()

      // Clear storage
      chrome.storage.sync.clear(() => {
        this.showStatusMessage('Settings reset to defaults', 'success')
      })
    }
  }

  showSavingState () {
    this.saveBtn.disabled = true
    this.saveBtn.querySelector('.btn-text').textContent = 'Saving...'
    this.saveBtn.querySelector('.btn-spinner').classList.remove('hidden')
  }

  resetSaveButton () {
    this.saveBtn.disabled = false
    this.saveBtn.querySelector('.btn-text').textContent = 'Save Settings'
    this.saveBtn.querySelector('.btn-spinner').classList.add('hidden')
  }

  showStatusMessage (message, type) {
    const statusText = this.statusMessage.querySelector('.status-text')
    statusText.textContent = message

    this.statusMessage.className = `status-message ${type}`
    this.statusMessage.classList.remove('hidden')

    // Auto-hide after 4 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        this.hideStatusMessage()
      }, 4000)
    }
  }

  hideStatusMessage () {
    this.statusMessage.classList.add('hidden')
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController()
})
