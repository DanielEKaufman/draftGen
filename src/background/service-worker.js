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
      const { extractedData, intent, rules, placeholders, config } = data

      // Validate required data
      if (!extractedData || !intent || !config || !config.apiKey) {
        return {
          success: false,
          error: 'Missing required data for email generation'
        }
      }

      // Build the prompt
      const prompt = this.buildPrompt(extractedData, intent, rules, placeholders)

      // Call AI provider
      const aiResponse = await this.callAIProvider(prompt, config)

      if (!aiResponse.success) {
        return aiResponse
      }

      // Parse the AI response
      const parsed = this.parseAIResponse(aiResponse.content)

      // Apply style rules enforcement
      const enforcedBody = StyleRules.enforce(parsed.body, rules)

      // Add placeholders  
      const finalBody = StyleRules.appendPlaceholders(enforcedBody, placeholders)

      return {
        success: true,
        subject: parsed.subject,
        body: finalBody,
        stats: StyleRules.generateStats(finalBody)
      }
    } catch (error) {
      console.error('Email generation error:', error)
      return {
        success: false,
        error: `Generation failed: ${error.message}`
      }
    }
  }

  buildPrompt (extractedData, intent, rules, placeholders) {
    const systemPrompt = this.getSystemPrompt(rules, placeholders)
    const userContent = this.formatUserContent(extractedData, intent)

    return {
      system: systemPrompt,
      user: userContent
    }
  }

  getSystemPrompt (rules, placeholders) {
    let prompt = `You are a precise, pithy outreach email writer. Your task is to write professional, concise emails that feel authentically human.

STRICT REQUIREMENTS:
- Keep emails short and conversational
- Focus on the recipient's background and interests
- Make a clear, specific ask
- Avoid generic language and filler phrases
- Sound professional but approachable

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

OUTPUT FORMAT:
Return your response in this exact format:

Subject: [Your subject line]

[Your email body]

PLACEHOLDERS:`

    if (placeholders.calendarLink) {
      prompt += `\n- Calendar link will be automatically added: ${placeholders.calendarLink}`
    }
    if (placeholders.bio) {
      prompt += `\n- Bio will be automatically added: ${placeholders.bio}`
    }

    if (!placeholders.calendarLink && !placeholders.bio) {
      prompt += '\n- None configured'
    }

    return prompt
  }

  formatUserContent (extractedData, intent) {
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
          'anthropic-version': '2023-06-01'
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

  parseAIResponse (content) {
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
}

// Initialize the background service
new BackgroundService()
