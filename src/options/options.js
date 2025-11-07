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

    // Notion CRM
    this.notionApiKey = document.getElementById('notionApiKey')
    this.toggleNotionApiKey = document.getElementById('toggleNotionApiKey')
    this.contactsDbId = document.getElementById('contactsDbId')
    this.projectsDbId = document.getElementById('projectsDbId')
    this.outreachLogsDbId = document.getElementById('outreachLogsDbId')
    this.testNotionBtn = document.getElementById('testNotionBtn')
    this.notionTestResult = document.getElementById('notionTestResult')

    // Templates
    this.addTemplateBtn = document.getElementById('addTemplateBtn')
    this.templatesList = document.getElementById('templatesList')
    this.templateModal = document.getElementById('templateModal')
    this.modalTitle = document.getElementById('modalTitle')
    this.closeModalBtn = document.getElementById('closeModalBtn')
    this.templateName = document.getElementById('templateName')
    this.templateDescription = document.getElementById('templateDescription')
    this.templateBody = document.getElementById('templateBody')
    this.templateContent = document.getElementById('templateContent')
    this.templateDefault = document.getElementById('templateDefault')
    this.saveTemplateBtn = document.getElementById('saveTemplateBtn')
    this.cancelTemplateBtn = document.getElementById('cancelTemplateBtn')

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
    
    // Initialize template state
    this.currentTemplate = null
    this.templates = []
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

    // Notion CRM
    this.toggleNotionApiKey.addEventListener('click', () => this.toggleNotionApiKeyVisibility())
    this.testNotionBtn.addEventListener('click', () => this.testNotionConnection())

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

    // Template management
    this.addTemplateBtn.addEventListener('click', () => this.openTemplateModal())
    this.closeModalBtn.addEventListener('click', () => this.closeTemplateModal())
    this.cancelTemplateBtn.addEventListener('click', () => this.closeTemplateModal())
    this.saveTemplateBtn.addEventListener('click', () => this.saveTemplate())

    // Modal close on background click
    this.templateModal.addEventListener('click', (e) => {
      if (e.target === this.templateModal) {
        this.closeTemplateModal()
      }
    })

    // Event delegation for template edit/delete buttons
    this.templatesList.addEventListener('click', (e) => {
      console.log('Templates list clicked:', e.target)
      if (e.target.classList.contains('edit-template-btn')) {
        const index = parseInt(e.target.getAttribute('data-index'))
        console.log('Edit button clicked for index:', index)
        this.editTemplate(index)
      } else if (e.target.classList.contains('delete-template-btn')) {
        const index = parseInt(e.target.getAttribute('data-index'))
        console.log('Delete button clicked for index:', index)
        this.deleteTemplate(index)
      }
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
        { value: 'claude-sonnet-4-5-20250929', text: 'Claude Sonnet 4.5 (Best for coding)' },
        { value: 'claude-sonnet-4-20250514', text: 'Claude Sonnet 4 (Balanced)' },
        { value: 'claude-haiku-4-5-20251001', text: 'Claude Haiku 4.5 (Fast & cheap)' },
        { value: 'claude-opus-4-1-20250805', text: 'Claude Opus 4.1 (Most capable)' },
        { value: 'claude-3-sonnet-20240229', text: 'Claude 3 Sonnet (Legacy)' },
        { value: 'claude-3-haiku-20240307', text: 'Claude 3 Haiku (Legacy)' }
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

  toggleNotionApiKeyVisibility () {
    const isPassword = this.notionApiKey.type === 'password'
    this.notionApiKey.type = isPassword ? 'text' : 'password'
    this.toggleNotionApiKey.textContent = isPassword ? '🙈' : '👁️'
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

  async testNotionConnection () {
    const notionApiKey = this.notionApiKey.value.trim()
    const contactsDbId = this.contactsDbId.value.trim()

    if (!notionApiKey) {
      this.showNotionTestResult('Please enter a Notion API key first', 'error')
      return
    }

    if (!contactsDbId) {
      this.showNotionTestResult('Please enter a Contacts Database ID', 'error')
      return
    }

    this.showNotionTestingState()

    try {
      const result = await this.callBackgroundService({
        action: 'testNotionConnection',
        data: { 
          notionApiKey, 
          contactsDbId,
          projectsDbId: this.projectsDbId.value.trim(),
          outreachLogsDbId: this.outreachLogsDbId.value.trim()
        }
      })

      if (result.success) {
        this.showNotionTestResult('✅ Notion connection successful!', 'success')
      } else {
        this.showNotionTestResult(`❌ ${result.error || 'Notion connection failed'}`, 'error')
      }
    } catch (error) {
      this.showNotionTestResult(`❌ Connection failed: ${error.message}`, 'error')
    } finally {
      this.resetNotionTestButton()
    }
  }

  showNotionTestingState () {
    this.testNotionBtn.disabled = true
    this.testNotionBtn.querySelector('.btn-text').textContent = 'Testing...'
    this.testNotionBtn.querySelector('.btn-spinner').classList.remove('hidden')
    this.clearNotionTestResult()
  }

  resetNotionTestButton () {
    this.testNotionBtn.disabled = false
    this.testNotionBtn.querySelector('.btn-text').textContent = 'Test Notion Connection'
    this.testNotionBtn.querySelector('.btn-spinner').classList.add('hidden')
  }

  showNotionTestResult (message, type) {
    this.notionTestResult.textContent = message
    this.notionTestResult.className = `test-result ${type}`
    this.notionTestResult.classList.remove('hidden')
  }

  clearNotionTestResult () {
    this.notionTestResult.classList.add('hidden')
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

      // Validate Notion CRM settings if provided
      if (settings.notionApiKey && !settings.contactsDbId) {
        this.showStatusMessage('Contacts Database ID is required when using Notion CRM', 'error')
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
      templates: this.templates,
      notionCrm: {
        apiKey: this.notionApiKey.value.trim(),
        contactsDbId: this.contactsDbId.value.trim(),
        projectsDbId: this.projectsDbId.value.trim(),
        outreachLogsDbId: this.outreachLogsDbId.value.trim()
      },
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
      await this.loadTemplates()
    } catch (error) {
      console.error('Load error:', error)
      this.showStatusMessage('Failed to load settings', 'error')
    }
  }

  loadFromStorage () {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'provider', 'apiKey', 'calendarLink', 'bio', 'model', 'debugMode', 'defaultPreferences', 'templates', 'notionCrm'
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

    // Notion CRM
    if (settings.notionCrm) {
      const crm = settings.notionCrm
      if (crm.apiKey) this.notionApiKey.value = crm.apiKey
      if (crm.contactsDbId) this.contactsDbId.value = crm.contactsDbId
      if (crm.projectsDbId) this.projectsDbId.value = crm.projectsDbId
      if (crm.outreachLogsDbId) this.outreachLogsDbId.value = crm.outreachLogsDbId
    }

    // Templates
    if (settings.templates) {
      this.templates = settings.templates
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
      this.notionApiKey.value = ''
      this.contactsDbId.value = ''
      this.projectsDbId.value = ''
      this.outreachLogsDbId.value = ''
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

  // Template Management Methods
  async loadTemplates () {
    try {
      const result = await this.loadTemplatesFromStorage()
      this.templates = result.templates || []
      this.renderTemplatesList()
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  loadTemplatesFromStorage () {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['templates'], (result) => {
        resolve(result)
      })
    })
  }

  renderTemplatesList () {
    console.log('Rendering templates list. Templates count:', this.templates.length)
    console.log('Templates:', this.templates)
    
    if (this.templates.length === 0) {
      this.templatesList.innerHTML = `
        <div class="templates-empty">
          No templates created yet. Click "Add Template" to create your first email template.
        </div>
      `
      return
    }

    this.templatesList.innerHTML = this.templates.map((template, index) => `
      <div class="template-item ${template.isDefault ? 'default' : ''}" data-index="${index}">
        <div class="template-info">
          <div class="template-name">
            ${this.escapeHtml(template.name)}
            ${template.isDefault ? '<span class="template-default-badge">Default</span>' : ''}
          </div>
          ${template.description ? `<div class="template-description">${this.escapeHtml(template.description)}</div>` : ''}
          <div class="template-preview">${this.escapeHtml((template.body || template.instructions || '').substring(0, 120))}${(template.body || template.instructions || '').length > 120 ? '...' : ''}</div>
        </div>
        <div class="template-actions">
          <button class="btn btn-secondary edit-template-btn" data-index="${index}">Edit</button>
          ${!template.isDefault ? `<button class="btn btn-secondary delete-template-btn" data-index="${index}">Delete</button>` : ''}
        </div>
      </div>
    `).join('')
  }

  openTemplateModal (template = null, index = null) {
    console.log('Opening template modal:', { template, index })
    this.currentTemplate = { template, index }
    
    if (template) {
      console.log('Editing existing template')
      this.modalTitle.textContent = 'Edit Template'
      this.templateName.value = template.name || ''
      this.templateDescription.value = template.description || ''
      this.templateBody.value = template.body || ''
      this.templateContent.value = template.instructions || ''
      this.templateDefault.checked = template.isDefault || false
    } else {
      console.log('Adding new template')
      this.modalTitle.textContent = 'Add Template'
      this.templateName.value = ''
      this.templateDescription.value = ''
      this.templateBody.value = ''
      this.templateContent.value = ''
      this.templateDefault.checked = false
    }

    console.log('Removing hidden class from modal')
    this.templateModal.classList.remove('hidden')
    setTimeout(() => {
      this.templateName.focus()
    }, 100)
  }

  closeTemplateModal () {
    this.templateModal.classList.add('hidden')
    this.currentTemplate = null
  }

  async saveTemplate () {
    const name = this.templateName.value.trim()
    const description = this.templateDescription.value.trim()
    const body = this.templateBody.value.trim()
    const instructions = this.templateContent.value.trim()
    const isDefault = this.templateDefault.checked

    if (!name) {
      this.templateName.focus()
      return
    }

    if (!body) {
      this.templateBody.focus()
      return
    }

    // Check for duplicate names (excluding current template being edited)
    const existingIndex = this.templates.findIndex((t, i) => 
      t.name.toLowerCase() === name.toLowerCase() && 
      i !== (this.currentTemplate?.index ?? -1)
    )
    
    if (existingIndex !== -1) {
      this.showStatusMessage('A template with this name already exists', 'error')
      this.templateName.focus()
      return
    }

    this.showTemplateSavingState()

    try {
      const newTemplate = {
        name,
        description,
        body,
        instructions,
        isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (this.currentTemplate?.index !== null) {
        // Editing existing template
        this.templates[this.currentTemplate.index] = {
          ...this.templates[this.currentTemplate.index],
          ...newTemplate
        }
      } else {
        // Adding new template
        this.templates.push(newTemplate)
      }

      // If this template is set as default, remove default from others
      if (isDefault) {
        this.templates.forEach((t, i) => {
          if (i !== this.currentTemplate?.index) {
            t.isDefault = false
          }
        })
      }

      // Ensure at least one template is default if this is the only one
      if (this.templates.length === 1) {
        this.templates[0].isDefault = true
      }

      await this.saveTemplatesToStorage()
      this.renderTemplatesList()
      this.closeTemplateModal()
      this.showStatusMessage('Template saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save template:', error)
      this.showStatusMessage('Failed to save template', 'error')
    } finally {
      this.resetTemplateSaveButton()
    }
  }

  editTemplate (index) {
    console.log('Edit template clicked, index:', index)
    console.log('Templates array:', this.templates)
    const template = this.templates[index]
    console.log('Template to edit:', template)
    this.openTemplateModal(template, index)
  }

  async deleteTemplate (index) {
    const template = this.templates[index]
    
    if (!confirm(`Are you sure you want to delete the "${template.name}" template?`)) {
      return
    }

    try {
      this.templates.splice(index, 1)
      
      // If we deleted the default template, make the first one default
      if (template.isDefault && this.templates.length > 0) {
        this.templates[0].isDefault = true
      }

      await this.saveTemplatesToStorage()
      this.renderTemplatesList()
      this.showStatusMessage('Template deleted successfully!', 'success')
    } catch (error) {
      console.error('Failed to delete template:', error)
      this.showStatusMessage('Failed to delete template', 'error')
    }
  }

  saveTemplatesToStorage () {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ templates: this.templates }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  showTemplateSavingState () {
    this.saveTemplateBtn.disabled = true
    this.saveTemplateBtn.querySelector('.btn-text').textContent = 'Saving...'
    this.saveTemplateBtn.querySelector('.btn-spinner').classList.remove('hidden')
  }

  resetTemplateSaveButton () {
    this.saveTemplateBtn.disabled = false
    this.saveTemplateBtn.querySelector('.btn-text').textContent = 'Save Template'
    this.saveTemplateBtn.querySelector('.btn-spinner').classList.add('hidden')
  }

  escapeHtml (text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
      .replace(/'/g, '&#39;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
}

// Initialize options page when DOM is ready
let optionsController
document.addEventListener('DOMContentLoaded', () => {
  optionsController = new OptionsController()
})
