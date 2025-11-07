// Notion CRM Service Class
class NotionService {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.notion.com/v1'
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    }
  }

  async searchContacts(contactsDbId, searchParams = {}) {
    try {
      const { email, firstName, lastName, company, linkedinUrl } = searchParams
      
      console.log('Notion search called with params:', searchParams)
      
      const filters = []
      
      // Build filters based on provided search parameters
      // Only match on high-confidence identifiers: LinkedIn URL or Email
      if (email) {
        console.log('Adding email filter:', email)
        filters.push({
          property: 'Email',
          email: { equals: email }
        })
      }
      
      if (linkedinUrl) {
        console.log('Adding LinkedIn URL filter:', linkedinUrl)
        console.log('LinkedIn URL type:', typeof linkedinUrl)
        console.log('LinkedIn URL length:', linkedinUrl.length)
        try {
          console.log('Normalized search URL:', this.normalizeLinkedInUrl(linkedinUrl))
        } catch (normalizationError) {
          console.error('Error normalizing search LinkedIn URL:', normalizationError)
        }
        filters.push({
          property: 'LinkedIn',
          url: { equals: linkedinUrl }
        })
      }
      
      // Note: Names and company are not used for matching as they can be ambiguous
      console.log('Total filters created:', filters.length)

      // If no high-confidence identifiers provided, return empty results
      if (filters.length === 0) {
        console.log('No email or LinkedIn URL provided - returning empty results')
        return {
          success: true,
          contacts: [],
          hasMore: false,
          nextCursor: null
        }
      }

      const requestBody = {
        filter: filters.length > 1 ? { or: filters } : filters[0],
        sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
        page_size: 10
      }
      
      console.log('Notion API request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${this.baseUrl}/databases/${contactsDbId}/query`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Notion API error:', error)
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('Notion API response:', data.results.length, 'contacts found')
      
      if (data.results.length > 0) {
        console.log('First contact found:', data.results[0])
      }
      
      const formattedContacts = []
      for (let i = 0; i < data.results.length; i++) {
        try {
          console.log(`Formatting contact ${i + 1}/${data.results.length}`)
          const formatted = this.formatContactData(data.results[i])
          formattedContacts.push(formatted)
          console.log(`Successfully formatted contact ${i + 1}:`, formatted)
        } catch (formatError) {
          console.error(`Error formatting contact ${i + 1}:`, formatError)
          console.log('Raw contact data that failed:', data.results[i])
        }
      }
      console.log('All formatted contacts:', formattedContacts)
      
      return {
        success: true,
        contacts: formattedContacts,
        hasMore: data.has_more,
        nextCursor: data.next_cursor
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to search contacts: ${error.message}`
      }
    }
  }

  async createContact(contactsDbId, contactData) {
    try {
      const { firstName, lastName, email, company, linkedinUrl, title, phone, notes } = contactData
      
      const properties = {}
      
      if (firstName) {
        properties['First Name'] = { rich_text: [{ text: { content: firstName } }] }
      }
      
      if (lastName) {
        properties['Last Name'] = { rich_text: [{ text: { content: lastName } }] }
      }
      
      if (email) {
        properties['Email'] = { email: email }
      }
      
      if (company) {
        properties['Company'] = { rich_text: [{ text: { content: company } }] }
      }
      
      if (linkedinUrl) {
        properties['LinkedIn'] = { url: linkedinUrl }
      }
      
      if (title) {
        properties['Title'] = { rich_text: [{ text: { content: title } }] }
      }
      
      if (phone) {
        properties['Phone'] = { phone_number: phone }
      }
      
      if (notes) {
        properties['Notes'] = { rich_text: [{ text: { content: notes } }] }
      }

      // Add creation timestamp
      properties['Created'] = { date: { start: new Date().toISOString() } }

      const requestBody = {
        parent: { database_id: contactsDbId },
        properties
      }

      const response = await fetch(`${this.baseUrl}/pages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        contact: this.formatContactData(data),
        contactId: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create contact: ${error.message}`
      }
    }
  }

  async getProjects(projectsDbId, contactId = null) {
    try {
      const filters = []
      
      if (contactId) {
        filters.push({
          property: 'Contacts',
          relation: { contains: contactId }
        })
      }

      const requestBody = {
        filter: filters.length > 0 ? (filters.length > 1 ? { and: filters } : filters[0]) : undefined,
        sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
        page_size: 20
      }

      const response = await fetch(`${this.baseUrl}/databases/${projectsDbId}/query`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        projects: data.results.map(this.formatProjectData),
        hasMore: data.has_more
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to get projects: ${error.message}`
      }
    }
  }

  async logOutreach(outreachLogsDbId, outreachData) {
    try {
      const { contactId, projectId, type, subject, content, status, scheduledFor } = outreachData
      
      const properties = {
        'Contact': { relation: [{ id: contactId }] },
        'Type': { select: { name: type || 'Email' } },
        'Subject': { rich_text: [{ text: { content: subject || '' } }] },
        'Content': { rich_text: [{ text: { content: content || '' } }] },
        'Status': { select: { name: status || 'Sent' } },
        'Date': { date: { start: new Date().toISOString() } }
      }
      
      if (projectId) {
        properties['Project'] = { relation: [{ id: projectId }] }
      }
      
      if (scheduledFor) {
        properties['Scheduled For'] = { date: { start: scheduledFor } }
      }

      const requestBody = {
        parent: { database_id: outreachLogsDbId },
        properties
      }

      const response = await fetch(`${this.baseUrl}/pages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        logId: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to log outreach: ${error.message}`
      }
    }
  }

  formatContactData(pageData) {
    try {
      const props = pageData.properties || {}
      console.log('Formatting contact data for:', pageData.id)
      console.log('Available properties:', Object.keys(props))
      
      const extractedLinkedInUrl = this.extractUrlProperty(props['LinkedIn'])
      
      const formatted = {
        id: pageData.id,
        firstName: this.extractTextProperty(props['First Name']),
        lastName: this.extractTextProperty(props['Last Name']),
        email: this.extractEmailProperty(props['Email']),
        company: this.extractTextProperty(props['Company']),
        title: this.extractTextProperty(props['Title']),
        linkedinUrl: extractedLinkedInUrl,
        phone: this.extractPhoneProperty(props['Phone']),
        notes: this.extractTextProperty(props['Notes']),
        created: this.extractDateProperty(props['Created']),
        lastModified: pageData.last_edited_time
      }
      
      // Detailed LinkedIn URL debugging
      if (extractedLinkedInUrl) {
        console.log('=== LINKEDIN URL DEBUG ===')
        console.log('Raw LinkedIn property from Notion:', props['LinkedIn'])
        console.log('Extracted LinkedIn URL:', JSON.stringify(extractedLinkedInUrl))
        console.log('LinkedIn URL type:', typeof extractedLinkedInUrl)
        console.log('LinkedIn URL length:', extractedLinkedInUrl.length)
        console.log('LinkedIn URL starts with:', extractedLinkedInUrl.substring(0, 50))
        console.log('LinkedIn URL ends with:', extractedLinkedInUrl.substring(Math.max(0, extractedLinkedInUrl.length - 30)))
        try {
          console.log('Normalized Notion URL:', this.normalizeLinkedInUrl(extractedLinkedInUrl))
        } catch (normalizationError) {
          console.error('Error normalizing LinkedIn URL:', normalizationError)
        }
        console.log('URL contains www:', extractedLinkedInUrl.includes('www'))
        console.log('URL protocol:', extractedLinkedInUrl.split('//')[0])
        console.log('URL path:', extractedLinkedInUrl.split('linkedin.com')[1] || 'NO LINKEDIN.COM FOUND')
        console.log('=== END LINKEDIN DEBUG ===')
      }
      
      console.log('Formatted contact:', formatted)
      console.log('Contact formatting completed successfully')
      return formatted
    } catch (error) {
      console.error('Error in formatContactData:', error)
      console.log('PageData that caused error:', pageData)
      throw error
    }
  }

  formatProjectData(pageData) {
    const props = pageData.properties || {}
    
    return {
      id: pageData.id,
      name: this.extractTitleProperty(props['Name']) || this.extractTextProperty(props['Project Name']),
      status: this.extractSelectProperty(props['Status']),
      description: this.extractTextProperty(props['Description']),
      created: this.extractDateProperty(props['Created']),
      lastModified: pageData.last_edited_time
    }
  }

  extractTextProperty(prop) {
    if (!prop || !prop.rich_text || !prop.rich_text[0]) return ''
    return prop.rich_text[0].text.content
  }

  extractTitleProperty(prop) {
    if (!prop || !prop.title || !prop.title[0]) return ''
    return prop.title[0].text.content
  }

  extractEmailProperty(prop) {
    return prop?.email || ''
  }

  extractUrlProperty(prop) {
    // console.log('extractUrlProperty called with:', prop)
    const url = prop?.url || ''
    // console.log('Extracted URL value:', url)
    return url
  }

  extractPhoneProperty(prop) {
    return prop?.phone_number || ''
  }

  extractSelectProperty(prop) {
    return prop?.select?.name || ''
  }

  normalizeLinkedInUrl(url) {
    if (!url) return ''
    
    // Remove trailing slashes and normalize protocol
    let normalized = url.toLowerCase().trim()
    
    // Ensure https
    if (normalized.startsWith('http://')) {
      normalized = normalized.replace('http://', 'https://')
    } else if (!normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }
    
    // Normalize www vs non-www
    normalized = normalized.replace('https://www.linkedin.com', 'https://linkedin.com')
    
    // Remove trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }
    
    return normalized
  }

  extractDateProperty(prop) {
    return prop?.date?.start || ''
  }
}

// Inline StyleRules class to avoid import issues
class StyleRules {
  static enforce (emailContent, rules = {}) {
    if (!emailContent || typeof emailContent !== 'string') {
      return emailContent
    }

    let processed = emailContent

    if (rules.maxSentences) {
      processed = this.enforceSentenceLimit(processed, 6)
    }

    if (rules.maxParagraphs) {
      processed = this.enforceParagraphLimit(processed, 2)
    }

    if (rules.noEmDashes) {
      processed = this.replaceEmDashes(processed)
    }

    return processed
  }

  static enforceSentenceLimit (text, maxSentences = 6) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    if (sentences.length <= maxSentences) {
      return text
    }

    const limitedSentences = sentences.slice(0, maxSentences)
    let result = ''
    const originalPunctuation = text.match(/[.!?]+/g) || []

    for (let i = 0; i < limitedSentences.length; i++) {
      result += limitedSentences[i].trim()
      
      if (i < originalPunctuation.length) {
        const punct = originalPunctuation[i] || '.'
        result += punct.charAt(0)
      } else {
        result += '.'
      }
      
      if (i < limitedSentences.length - 1) {
        result += ' '
      }
    }

    return result
  }

  static enforceParagraphLimit (text, maxParagraphs = 2) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    
    if (paragraphs.length <= maxParagraphs) {
      return text
    }

    const limitedParagraphs = paragraphs.slice(0, maxParagraphs)
    return limitedParagraphs.map(p => p.trim()).join('\n\n')
  }

  static replaceEmDashes (text) {
    return text
      .replace(/\s*—\s*/g, ', ')
      .replace(/\s*--\s*/g, ', ')
      .replace(/,,+/g, ',')
      .replace(/\s*,\s*([.!?])/g, '$1')
      .replace(/,\s*,/g, ',')
  }

  static appendPlaceholders (text, placeholders = {}) {
    if (!text) return text

    let result = text.trim()
    
    if (!result.match(/[.!?]$/)) {
      result += '.'
    }

    if (placeholders.calendarLink) {
      result += `\n\nCalendar: ${placeholders.calendarLink}`
    }

    if (placeholders.bio) {
      result += `\n\n${placeholders.bio}`
    }

    return result
  }

  static generateStats (text) {
    return {
      sentences: this.countSentences(text),
      paragraphs: this.countParagraphs(text),
      words: this.countWords(text),
      characters: text ? text.length : 0
    }
  }

  static countSentences (text) {
    if (!text) return 0
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  }

  static countParagraphs (text) {
    if (!text) return 0
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  }

  static countWords (text) {
    if (!text) return 0
    return text.split(/\s+/).filter(w => w.length > 0).length
  }
}

class BackgroundService {
  constructor () {
    this.setupMessageListener()
    console.log('One-Click Outreach background service initialized')
  }

  setupMessageListener () {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse)
      return true // Keep message channel open for async response
    })
  }

  async handleMessage (request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'generateEmail':
          const result = await this.generateEmail(request.data)
          sendResponse(result)
          break

        case 'testApiConnection':
          const testResult = await this.testApiConnection(request.data)
          sendResponse(testResult)
          break

        case 'testNotionConnection':
          const notionTestResult = await this.testNotionConnection(request.data)
          sendResponse(notionTestResult)
          break

        case 'searchContacts':
          const searchResult = await this.searchContacts(request.data)
          sendResponse(searchResult)
          break

        case 'createContact':
          const createResult = await this.createContact(request.data)
          sendResponse(createResult)
          break

        case 'getProjects':
          const projectsResult = await this.getProjects(request.data)
          sendResponse(projectsResult)
          break

        case 'logOutreach':
          const logResult = await this.logOutreach(request.data)
          sendResponse(logResult)
          break

        default:
          sendResponse({ success: false, error: 'Unknown action' })
      }
    } catch (error) {
      console.error('Background service error:', error)
      sendResponse({
        success: false,
        error: error.message || 'Background service error'
      })
    }
  }

  async generateEmail (data) {
    try {
      const { extractedData, intent, rules, placeholders, config, template, crmContext } = data

      // Validate required data
      if (!extractedData || !intent || !config || !config.apiKey) {
        return {
          success: false,
          error: 'Missing required data for email generation'
        }
      }

      // Build the prompt with optional template
      const prompt = this.buildPrompt(extractedData, intent, rules, placeholders, template, crmContext)

      // Call AI provider
      const aiResponse = await this.callAIProvider(prompt, config)

      if (!aiResponse.success) {
        return aiResponse
      }

      // Parse the AI response
      const parsed = this.parseAIResponse(aiResponse.content, template)

      // Apply template body structure if available
      let finalBody
      if (template && template.body) {
        finalBody = this.applyTemplateBody(template.body, parsed.body, extractedData, placeholders)
      } else {
        // Apply style rules enforcement for non-template emails
        const enforcedBody = StyleRules.enforce(parsed.body, rules)
        // Add placeholders  
        finalBody = StyleRules.appendPlaceholders(enforcedBody, placeholders)
      }

      // Log outreach to Notion if CRM is configured and contact exists
      if (crmContext && crmContext.hasContact && config.notionCrm && config.notionCrm.apiKey && config.notionCrm.outreachLogsDbId) {
        this.logOutreachToNotionAsync({
          contactId: crmContext.contact.id || null,
          projectId: crmContext.activeProjects && crmContext.activeProjects.length > 0 ? crmContext.activeProjects[0].id : null,
          subject: parsed.subject,
          content: finalBody,
          crmContext,
          config
        }).catch(error => {
          console.error('Async outreach logging error:', error)
        })
      }

      return {
        success: true,
        subject: parsed.subject,
        body: finalBody,
        stats: StyleRules.generateStats(finalBody),
        templateUsed: template?.name || 'Default'
      }
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error.message}`
      }
    }
  }

  async testApiConnection (data) {
    const { apiKey, provider } = data

    try {
      const testPrompt = {
        system: 'You are a helpful assistant. Respond with exactly: "API connection successful"',
        user: 'Test connection'
      }

      const result = await this.callAIProvider(testPrompt, {
        provider,
        apiKey,
        model: provider === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-4o-mini'
      })

      if (result.success && result.content.toLowerCase().includes('api connection successful')) {
        return { success: true, message: 'API connection verified' }
      } else if (result.success) {
        return { success: true, message: 'API responded but with unexpected content' }
      } else {
        return result
      }
    } catch (error) {
      console.error('Email generation error:', error)
      return {
        success: false,
        error: `Generation failed: ${error.message}`
      }
    }
  }

  buildPrompt (extractedData, intent, rules, placeholders, template, crmContext) {
    const systemPrompt = this.getSystemPrompt(rules, placeholders, template, crmContext)
    const userContent = this.formatUserContent(extractedData, intent, crmContext)

    return {
      system: systemPrompt,
      user: userContent
    }
  }

  getSystemPrompt (rules, placeholders, template, crmContext) {
    let prompt = `You are Dan Kaufman writing outreach emails. Write in Dan's authentic, direct conversational style.

DAN'S VOICE AND TONE:
- Direct and conversational, avoiding corporate jargon
- Reference specific context about the recipient's work (posts, presentations, case studies)
- Clear value proposition with concrete examples
- Professional but warm and approachable
- Make specific, actionable asks
- Mention real connections or mutual interests when possible

WRITING STYLE:
- Start with a personal connection or specific observation about their work
- Reference specific details like webinars, LinkedIn posts, or projects
- Use casual but professional language ("I came across", "I noticed", "I'd love to")
- End with warm but professional closings (Best, Cheers, Thank you)
- Include calendar booking for easy scheduling`

    // Add template-specific instructions
    if (template) {
      if (template.body) {
        prompt += `

TEMPLATE MODE: You are filling in a structured email template.
Template structure: ${template.body}

CRITICAL INSTRUCTIONS:
- ONLY write the content that goes in the {custom_content} section
- Do NOT write greetings like "Hi [name]" or "Dear [name]" 
- Do NOT write closings like "Best regards" or "Sincerely"
- Do NOT include your name or signature
- Do NOT write a complete email
- ONLY write the middle personalized content paragraphs
- Start immediately with the personalized message content`

        if (template.instructions) {
          prompt += `

CONTENT INSTRUCTIONS:
${template.instructions}`
        }
      } else if (template.instructions) {
        prompt += `

TEMPLATE INSTRUCTIONS:
${template.instructions}

Follow these template-specific guidelines while maintaining Dan's voice and tone.`
      }
    }

    // Add CRM context if available
    if (crmContext && crmContext.hasContact) {
      prompt += `

CRM CONTEXT:
This person is an EXISTING CONTACT in your CRM system.
`
      
      const contact = crmContext.contact
      if (contact.name) {
        prompt += `- Contact Name: ${contact.name}\n`
      }
      if (contact.company && contact.title) {
        prompt += `- Position: ${contact.title} at ${contact.company}\n`
      } else if (contact.company) {
        prompt += `- Company: ${contact.company}\n`
      } else if (contact.title) {
        prompt += `- Title: ${contact.title}\n`
      }
      
      if (crmContext.projectSummary) {
        prompt += `- Current Projects: ${crmContext.projectSummary}\n`
      }
      
      if (crmContext.relationship && crmContext.relationship.notes) {
        prompt += `- Previous Notes: ${crmContext.relationship.notes}\n`
      }
      
      prompt += `
IMPORTANT: Since this is an existing contact, reference your ongoing relationship and current projects where appropriate. Avoid introductory language and instead focus on follow-up, updates, or new opportunities.`
    } else if (crmContext === null) {
      prompt += `

CRM CONTEXT:
This is a NEW CONTACT not yet in your CRM system. Use appropriate introductory language and focus on establishing the relationship.`
    }

    prompt += `

FORMATTING RULES:`

    if (rules.maxSentences) {
      prompt += '\n- Maximum 6 sentences total'
    }
    if (rules.maxParagraphs) {
      prompt += '\n- Limit to 1-2 short paragraphs'
    }
    if (rules.noEmDashes) {
      prompt += '\n- Never use em dashes (—) or double hyphens (--)'
    }

    prompt += `

HYPERLINKS:
- Always include clickable hyperlinks using HTML format: <a href="URL">text</a>
- Include Dan's LinkedIn profile link: <a href="https://linkedin.com/in/dankaufman">LinkedIn</a>
- Make calendar link clickable: <a href="https://calendar.app.google/BKgyQ4c1NsV8hGDr8">calendar</a>
- Include contact email as mailto link: <a href="mailto:kaufman.dan@gmail.com">kaufman.dan@gmail.com</a>

OUTPUT FORMAT:`
    
    // Add subject line instructions for non-template mode
    if (!template?.body) {
      prompt += `

SUBJECT LINE REQUIREMENTS:
- Create a compelling, specific subject line that reflects the email's purpose
- Include the recipient's company name when relevant
- Keep it under 50 characters
- Avoid generic phrases like "Reaching out" or "Quick question"
- Examples: "Partnership opportunity - [Company]", "Quick call - [Name]", "Collaboration at [Company]"`
    }
    
    if (template && template.body) {
      prompt += `
RESPONSE FORMAT: Return ONLY the personalized content paragraphs.

EXAMPLE TEMPLATE: "Hi {first_name}, {custom_content} Best, Dan"
EXAMPLE RESPONSE: "I noticed your recent LinkedIn post about real estate financing. I've been working on similar challenges and would love to share some insights."

DO NOT include:
- Subject lines
- Greetings (Hi, Hello, Dear)  
- Closings (Best, Sincerely, Thanks)
- Names or signatures
- Template structure

ONLY provide the middle content paragraphs.`
    } else {
      prompt += `
Return your response in this exact format:

Subject: [Your subject line]

[Your email body with HTML hyperlinks]`
    }

    prompt += `

SIGNATURE ELEMENTS:`

    if (placeholders.calendarLink) {
      prompt += `\n- Calendar booking will be added: <a href="${placeholders.calendarLink}">calendar</a>`
    } else {
      prompt += `\n- Default calendar: <a href="https://calendar.app.google/BKgyQ4c1NsV8hGDr8">calendar</a>`
    }
    
    prompt += `\n- LinkedIn: <a href="https://linkedin.com/in/dankaufman">LinkedIn</a>`
    prompt += `\n- Email: <a href="mailto:kaufman.dan@gmail.com">kaufman.dan@gmail.com</a>`
    
    if (placeholders.bio) {
      prompt += `\n- Bio will be automatically added: ${placeholders.bio}`
    }

    return prompt
  }

  formatUserContent (extractedData, intent, crmContext) {
    let content = 'RECIPIENT INFORMATION:\n'

    if (extractedData.source === 'linkedin') {
      const data = extractedData.data
      content += `Name: ${data.name || 'Unknown'}\n`
      content += `Headline: ${data.headline || 'N/A'}\n`
      if (data.location) content += `Location: ${data.location}\n`
      if (data.about) content += `About: ${data.about}\n`
      if (data.experience && data.experience.length > 0) {
        content += 'Recent Experience:\n'
        data.experience.slice(0, 2).forEach(exp => {
          content += `- ${exp.title} at ${exp.company}\n`
        })
      }
    } else {
      const data = extractedData.data
      content += `Source: ${data.domain || 'Unknown website'}\n`
      if (data.title) content += `Page Title: ${data.title}\n`
      if (data.content) content += `Content: ${data.content.substring(0, 800)}${data.content.length > 800 ? '...' : ''}\n`
    }

    // Add CRM context to user content
    if (crmContext && crmContext.hasContact) {
      content += `\nCRM CONTACT DATA:\n`
      const contact = crmContext.contact
      
      if (contact.firstName && contact.lastName) {
        content += `- Full Name: ${contact.firstName} ${contact.lastName}\n`
      }
      if (contact.email) {
        content += `- Email: ${contact.email}\n`
      }
      if (contact.company) {
        content += `- Company: ${contact.company}\n`
      }
      if (contact.title) {
        content += `- Title: ${contact.title}\n`
      }
      
      content += `- Relationship Status: Existing contact in CRM\n`
      
      if (crmContext.relationship && crmContext.relationship.lastModified) {
        content += `- Last CRM Update: ${crmContext.relationship.lastModified}\n`
      }
      
      if (crmContext.projects && crmContext.projects.length > 0) {
        content += `\nCURRENT PROJECTS:\n`
        crmContext.projects.forEach((project, index) => {
          content += `${index + 1}. ${project.name}`
          if (project.status) content += ` (Status: ${project.status})`
          if (project.description) content += ` - ${project.description}`
          content += `\n`
        })
      }
      
      if (crmContext.relationship && crmContext.relationship.notes) {
        content += `\nPREVIOUS NOTES: ${crmContext.relationship.notes}\n`
      }
    } else {
      content += `\nCRM STATUS: New contact (not in CRM database)\n`
    }

    content += `\nMESSAGE INTENT: ${intent}`

    return content
  }

  async callAIProvider (prompt, config) {
    const { provider, apiKey, model } = config

    if (provider === 'anthropic') {
      return await this.callClaude(prompt, apiKey, model)
    } else if (provider === 'openai') {
      return await this.callOpenAI(prompt, apiKey, model)
    } else {
      return { success: false, error: 'Unknown AI provider' }
    }
  }

  async callClaude (prompt, apiKey, model = 'claude-3-sonnet-20240229') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `${prompt.system}\n\n${prompt.user}`
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: `Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        content: data.content[0]?.text || ''
      }
    } catch (error) {
      return {
        success: false,
        error: `Claude API call failed: ${error.message}`
      }
    }
  }

  async callOpenAI (prompt, apiKey, model = 'gpt-4o') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: prompt.system
            },
            {
              role: 'user',
              content: prompt.user
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        content: data.choices[0]?.message?.content || ''
      }
    } catch (error) {
      return {
        success: false,
        error: `OpenAI API call failed: ${error.message}`
      }
    }
  }

  parseAIResponse (content, template) {
    // If using a template body, the response is just the custom content
    if (template && template.body) {
      console.log('Template mode: Raw AI response:', content)
      const cleanedContent = content.trim()
      console.log('Template mode: Cleaned content:', cleanedContent)
      // Generate a thoughtful subject line based on content
      const subject = this.generateSubjectFromContent(cleanedContent, extractedData, template)
      
      return {
        subject: subject,
        body: cleanedContent
      }
    }

    // Original parsing for full email responses
    // Look for "Subject:" pattern
    const subjectMatch = content.match(/Subject:\s*(.+)/i)
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Follow up'

    // Extract body (everything after subject line)
    let body = content
    if (subjectMatch) {
      const subjectLineEnd = content.indexOf(subjectMatch[0]) + subjectMatch[0].length
      body = content.substring(subjectLineEnd).trim()
    }

    // Clean up body
    body = body
      .replace(/^[\n\r]+/, '') // Remove leading newlines
      .replace(/[\n\r]+$/, '') // Remove trailing newlines
      .trim()

    return { subject, body }
  }

  appendPlaceholdersSimple (text, placeholders) {
    if (!text) return text

    let result = text.trim()

    if (!result.match(/[.!?]$/)) {
      result += '.'
    }

    if (placeholders.calendarLink) {
      result += `\n\nCalendar: ${placeholders.calendarLink}`
    }

    if (placeholders.bio) {
      result += `\n\n${placeholders.bio}`
    }

    return result
  }

  async testApiConnection (data) {
    const { apiKey, provider } = data

    try {
      const testPrompt = {
        system: 'You are a helpful assistant. Respond with exactly: "API connection successful"',
        user: 'Test connection'
      }

      const result = await this.callAIProvider(testPrompt, {
        provider,
        apiKey,
        model: provider === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-4o-mini'
      })

      if (result.success && result.content.toLowerCase().includes('api connection successful')) {
        return { success: true, message: 'API connection verified' }
      } else if (result.success) {
        return { success: true, message: 'API responded but with unexpected content' }
      } else {
        return result
      }
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error.message}`
      }
    }
  }

  async testNotionConnection (data) {
    const { notionApiKey, contactsDbId, projectsDbId, outreachLogsDbId } = data

    try {
      const errors = []
      const results = {}

      // Test Contacts Database
      if (contactsDbId) {
        try {
          const contactsResponse = await fetch(`https://api.notion.com/v1/databases/${contactsDbId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${notionApiKey}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            }
          })

          if (contactsResponse.ok) {
            const contactsData = await contactsResponse.json()
            results.contacts = { status: 'success', title: contactsData.title?.[0]?.plain_text || 'Contacts Database' }
          } else {
            const errorData = await contactsResponse.json()
            results.contacts = { status: 'error', error: errorData.message || `HTTP ${contactsResponse.status}` }
            errors.push(`Contacts DB: ${errorData.message || 'Access denied'}`)
          }
        } catch (error) {
          results.contacts = { status: 'error', error: error.message }
          errors.push(`Contacts DB: ${error.message}`)
        }
      }

      // Test Projects Database (if provided)
      if (projectsDbId) {
        try {
          const projectsResponse = await fetch(`https://api.notion.com/v1/databases/${projectsDbId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${notionApiKey}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            }
          })

          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            results.projects = { status: 'success', title: projectsData.title?.[0]?.plain_text || 'Projects Database' }
          } else {
            const errorData = await projectsResponse.json()
            results.projects = { status: 'error', error: errorData.message || `HTTP ${projectsResponse.status}` }
            errors.push(`Projects DB: ${errorData.message || 'Access denied'}`)
          }
        } catch (error) {
          results.projects = { status: 'error', error: error.message }
          errors.push(`Projects DB: ${error.message}`)
        }
      }

      // Test Outreach Logs Database (if provided)
      if (outreachLogsDbId) {
        try {
          const logsResponse = await fetch(`https://api.notion.com/v1/databases/${outreachLogsDbId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${notionApiKey}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            }
          })

          if (logsResponse.ok) {
            const logsData = await logsResponse.json()
            results.outreachLogs = { status: 'success', title: logsData.title?.[0]?.plain_text || 'Outreach Logs Database' }
          } else {
            const errorData = await logsResponse.json()
            results.outreachLogs = { status: 'error', error: errorData.message || `HTTP ${logsResponse.status}` }
            errors.push(`Outreach Logs DB: ${errorData.message || 'Access denied'}`)
          }
        } catch (error) {
          results.outreachLogs = { status: 'error', error: error.message }
          errors.push(`Outreach Logs DB: ${error.message}`)
        }
      }

      // Determine overall success
      const hasErrors = errors.length > 0
      const contactsWorking = results.contacts?.status === 'success'

      if (!hasErrors && contactsWorking) {
        return { 
          success: true, 
          message: 'All Notion databases accessible!',
          results 
        }
      } else if (contactsWorking) {
        return { 
          success: true, 
          message: `Contacts DB working. Issues: ${errors.join(', ')}`,
          results 
        }
      } else {
        return { 
          success: false, 
          error: errors.length > 0 ? errors.join(', ') : 'Failed to access Notion databases',
          results 
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Notion connection test failed: ${error.message}`
      }
    }
  }

  async searchContacts (data) {
    try {
      const { notionApiKey, contactsDbId, searchParams } = data
      
      if (!notionApiKey || !contactsDbId) {
        return {
          success: false,
          error: 'Notion API key and Contacts Database ID are required'
        }
      }

      const notionService = new NotionService(notionApiKey)
      return await notionService.searchContacts(contactsDbId, searchParams)
    } catch (error) {
      return {
        success: false,
        error: `Contact search failed: ${error.message}`
      }
    }
  }

  async createContact (data) {
    try {
      const { notionApiKey, contactsDbId, contactData } = data
      
      if (!notionApiKey || !contactsDbId) {
        return {
          success: false,
          error: 'Notion API key and Contacts Database ID are required'
        }
      }

      const notionService = new NotionService(notionApiKey)
      return await notionService.createContact(contactsDbId, contactData)
    } catch (error) {
      return {
        success: false,
        error: `Contact creation failed: ${error.message}`
      }
    }
  }

  async getProjects (data) {
    try {
      const { notionApiKey, projectsDbId, contactId } = data
      
      if (!notionApiKey || !projectsDbId) {
        return {
          success: false,
          error: 'Notion API key and Projects Database ID are required'
        }
      }

      const notionService = new NotionService(notionApiKey)
      return await notionService.getProjects(projectsDbId, contactId)
    } catch (error) {
      return {
        success: false,
        error: `Projects lookup failed: ${error.message}`
      }
    }
  }

  async logOutreach (data) {
    try {
      const { notionApiKey, outreachLogsDbId, outreachData } = data
      
      if (!notionApiKey || !outreachLogsDbId) {
        return {
          success: false,
          error: 'Notion API key and Outreach Logs Database ID are required'
        }
      }

      const notionService = new NotionService(notionApiKey)
      return await notionService.logOutreach(outreachLogsDbId, outreachData)
    } catch (error) {
      return {
        success: false,
        error: `Outreach logging failed: ${error.message}`
      }
    }
  }

  async logOutreachToNotionAsync (logData) {
    try {
      console.log('Logging outreach to Notion:', logData)
      
      const outreachData = {
        contactId: logData.contactId,
        projectId: logData.projectId,
        type: 'Email',
        subject: logData.subject,
        content: this.stripHtmlTags(logData.content),
        status: 'Generated'
      }
      
      const result = await this.logOutreach({
        notionApiKey: logData.config.notionCrm.apiKey,
        outreachLogsDbId: logData.config.notionCrm.outreachLogsDbId,
        outreachData
      })
      
      if (result.success) {
        console.log('Outreach logged successfully:', result.logId)
      } else {
        console.error('Failed to log outreach:', result.error)
      }
    } catch (error) {
      console.error('Error logging outreach to Notion:', error)
    }
  }

  stripHtmlTags (html) {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  }

  applyTemplateBody (templateBody, customContent, extractedData, placeholders) {
    console.log('Applying template body:', templateBody)
    console.log('Custom content to insert:', customContent)
    
    let processedBody = templateBody

    // Extract first name from recipient data
    let firstName = ''
    if (extractedData && extractedData.data) {
      const fullName = extractedData.data.name || ''
      firstName = fullName.split(' ')[0] || ''
    }

    // Extract company name
    let company = ''
    if (extractedData && extractedData.data) {
      if (extractedData.source === 'linkedin' && extractedData.data.experience) {
        company = extractedData.data.experience[0]?.company || ''
      } else {
        company = extractedData.data.domain || ''
      }
    }

    // Process hyperlinks first (before placeholder replacement)
    processedBody = this.processHyperlinks(processedBody, placeholders)

    // Replace remaining placeholders
    const replacements = {
      '{first_name}': firstName,
      '{company}': company,
      '{custom_content}': customContent.trim(),
      '{calendar_link}': this.formatCalendarLink(placeholders.calendarLink),
      '{bio}': placeholders.bio || ''
    }

    // Apply replacements
    Object.entries(replacements).forEach(([placeholder, value]) => {
      processedBody = processedBody.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '')
    })

    // Clean up extra whitespace while preserving newlines
    processedBody = processedBody
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks (3+ becomes 2)
      .replace(/\s+$/gm, '') // Remove trailing spaces
      .trim()
    
    // Convert newlines to HTML line breaks for proper display
    processedBody = processedBody.replace(/\n/g, '<br>')

    console.log('Final processed template body:', processedBody)
    return processedBody
  }

  generateSubjectFromContent (content, extractedData, template) {
    // Get recipient details
    const recipientName = extractedData?.data?.name || ''
    const firstName = recipientName.split(' ')[0] || ''
    const company = extractedData?.data?.company || 
                   (extractedData?.data?.experience && extractedData.data.experience[0]?.company) || ''
    
    // Determine email purpose from content
    const contentLower = content.toLowerCase()
    let purpose = ''
    
    if (contentLower.includes('follow') || contentLower.includes('following up')) {
      purpose = 'follow-up'
    } else if (contentLower.includes('collaboration') || contentLower.includes('partner') || contentLower.includes('work together')) {
      purpose = 'collaboration'
    } else if (contentLower.includes('meeting') || contentLower.includes('call') || contentLower.includes('chat')) {
      purpose = 'meeting'
    } else if (contentLower.includes('opportunity') || contentLower.includes('project')) {
      purpose = 'opportunity'
    } else if (contentLower.includes('introduction') || contentLower.includes('connect')) {
      purpose = 'introduction'
    } else {
      purpose = 'outreach'
    }
    
    // Generate subject based on purpose and context
    const subjects = {
      'follow-up': [
        `Following up${company ? ` - ${company}` : ''}`,
        `Quick follow-up${firstName ? ` ${firstName}` : ''}`,
        `${company || 'Our'} conversation follow-up`
      ],
      'collaboration': [
        `Collaboration opportunity${company ? ` - ${company}` : ''}`,
        `Partnership discussion${firstName ? ` - ${firstName}` : ''}`,
        `Working together${company ? ` at ${company}` : ''}`
      ],
      'meeting': [
        `Quick call${company ? ` - ${company}` : ''}`,
        `Meeting request${firstName ? ` - ${firstName}` : ''}`,
        `${company || 'Discussion'} - Brief chat`
      ],
      'opportunity': [
        `Opportunity to connect${company ? ` - ${company}` : ''}`,
        `Potential collaboration${firstName ? ` ${firstName}` : ''}`,
        `${company || 'Business'} opportunity`
      ],
      'introduction': [
        `Introduction${company ? ` - ${company}` : ''}`,
        `Nice to meet you${firstName ? ` ${firstName}` : ''}`,
        `Connection request${company ? ` - ${company}` : ''}`
      ],
      'outreach': [
        `Reaching out${company ? ` - ${company}` : ''}`,
        `Quick note${firstName ? ` ${firstName}` : ''}`,
        `${company || 'Professional'} connection`
      ]
    }
    
    // Select the first subject option for the purpose
    const subjectOptions = subjects[purpose] || subjects['outreach']
    return subjectOptions[0] || 'Quick follow-up'
  }

  formatCalendarLink (calendarLink) {
    if (!calendarLink) return ''
    
    // If it's already formatted as HTML link, return as is
    if (calendarLink.includes('<a href=')) return calendarLink
    
    // Format as HTML link for Gmail compatibility
    return `<a href="${calendarLink}">calendar</a>`
  }

  processHyperlinks (text, placeholders) {
    if (!text) return text

    // Define URL mappings for placeholder-based links
    const urlMappings = {
      'calendar_link': placeholders.calendarLink || 'https://calendar.app.google/BKgyQ4c1NsV8hGDr8',
      'linkedin': 'https://linkedin.com/in/dankaufman',
      'email': 'mailto:kaufman.dan@gmail.com'
    }

    // Process [text]{placeholder} syntax
    text = text.replace(/\[([^\]]+)\]\{([^}]+)\}/g, (match, linkText, placeholder) => {
      const url = urlMappings[placeholder]
      if (url) {
        return `<a href="${url}">${linkText}</a>`
      }
      return match // Leave unchanged if placeholder not found
    })

    // Process [text](URL) syntax
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      return `<a href="${url}">${linkText}</a>`
    })

    return text
  }
}

// Initialize the background service
new BackgroundService()
