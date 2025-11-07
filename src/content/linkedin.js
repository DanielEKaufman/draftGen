// Prevent redeclaration if script is loaded multiple times
if (typeof window.LinkedInExtractor === 'undefined') {
  class LinkedInExtractor {
    constructor () {
      this.data = {}
      this.isDataReady = false
    }

    extractProfileData () {
      try {
        console.log('🚀 Starting AI-powered LinkedIn data extraction on URL:', window.location.href)
        
        // Debug DOM structure
        this.debugPageStructure()
        
        // Try unified dynamic discovery if traditional methods fail
        const dynamicData = this.unifiedDynamicDiscovery()
        
        const experience = this.extractExperience()
        const currentJob = experience && experience.length > 0 ? experience[0] : null
        
        const data = {
          name: dynamicData.name || this.extractName(),
          firstName: null, // Will be parsed from name in popup
          lastName: null,  // Will be parsed from name in popup
          headline: dynamicData.headline || this.extractHeadline(),
          about: this.extractAbout(),
          experience: experience,
          location: this.extractLocation(),
          company: dynamicData.company || (currentJob ? currentJob.company : null),
          title: dynamicData.title || (currentJob ? currentJob.title : null),
          linkedinUrl: window.location.href,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }

        console.log('🎯 Final extraction data:', data)

        // Validate that we didn't extract UI elements
        if (data.name && !this.validateAsRealName(data.name)) {
          console.log('❌ Detected invalid name, clearing it:', data.name)
          data.name = null
        }

        this.data = data
        this.isDataReady = true

        console.log('🎯 LinkedIn data extraction complete:', data)
        
        // Check if we got meaningful data
        const hasContent = data.name || data.headline || data.about || (data.experience && data.experience.length > 0)
        console.log('✅ Has meaningful content:', hasContent)
        
        return data
      } catch (error) {
        console.error('❌ Error extracting LinkedIn data:', error)
        return null
      }
    }

    unifiedDynamicDiscovery() {
      console.log('🤖 Running unified AI-powered content discovery...')
      
      const result = { name: null, headline: null, company: null, title: null }
      const allCandidates = []
      
      // First try to find the name using more targeted approach
      const nameResult = this.findProfileName()
      if (nameResult) {
        result.name = nameResult
        allCandidates.push({ text: nameResult, type: 'name', score: 100, element: null })
      }
      
      // Then find headline/job info
      const jobInfo = this.findJobInformation()
      if (jobInfo.headline) result.headline = jobInfo.headline
      if (jobInfo.company) result.company = jobInfo.company
      if (jobInfo.title) result.title = jobInfo.title
      
      // Fallback to general analysis if specific methods didn't work
      if (!result.name || !result.headline) {
        const allElements = document.querySelectorAll('*')
        
        for (const element of allElements) {
          const text = element.textContent?.trim()
          if (!text || element.children.length > 3) continue
          
          // Score each element for multiple content types
          const nameScore = this.scoreAsName(text, element)
          const headlineScore = this.scoreAsHeadline(text, element)
          
          if (nameScore > 40) {
            allCandidates.push({ text, type: 'name', score: nameScore, element })
          }
          
          if (headlineScore > 30) {
            allCandidates.push({ text, type: 'headline', score: headlineScore, element })
            
            // Try to extract company/title from headline
            const experience = this.parseHeadlineForExperience(text)
            if (experience) {
              allCandidates.push({ 
                text: experience.company, 
                type: 'company', 
                score: headlineScore + 10, 
                element 
              })
              allCandidates.push({ 
                text: experience.title, 
                type: 'title', 
                score: headlineScore + 5, 
                element 
              })
            }
          }
        }
        
        // Sort by type and score, then pick best candidates if we don't have them already
        const namesCandidates = allCandidates.filter(c => c.type === 'name').sort((a, b) => b.score - a.score)
        const headlineCandidates = allCandidates.filter(c => c.type === 'headline').sort((a, b) => b.score - a.score)
        const companyCandidates = allCandidates.filter(c => c.type === 'company').sort((a, b) => b.score - a.score)
        const titleCandidates = allCandidates.filter(c => c.type === 'title').sort((a, b) => b.score - a.score)
        
        if (!result.name && namesCandidates.length > 0) result.name = namesCandidates[0].text
        if (!result.headline && headlineCandidates.length > 0) result.headline = headlineCandidates[0].text
        if (!result.company && companyCandidates.length > 0) result.company = companyCandidates[0].text
        if (!result.title && titleCandidates.length > 0) result.title = titleCandidates[0].text
      }
      
      console.log('🎯 Unified discovery results:', result)
      console.log('📊 Found candidates:', allCandidates.length)
      
      return result
    }

    findProfileName() {
      console.log('🔍 Looking for profile name with targeted approach...')

      // PRIORITY 1: Try known LinkedIn profile name selectors
      const knownSelectors = [
        'h1.text-heading-xlarge', // Main profile name heading
        'h1[data-anonymize="person-name"]', // LinkedIn's anonymized data attribute
        'main section:first-of-type h1', // First h1 in main section
        '.pv-top-card h1', // Profile view top card
        '.ph5.pb5 h1' // Profile header area
      ]

      for (const selector of knownSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          const text = element.textContent?.trim()
          if (text && text.match(/^[A-Z][a-z]+(\s+[A-Z]\.?)?\s+[A-Z][a-z-]+(\s+[A-Z][a-z-]+)*$/)) {
            console.log('✅ Found name via known selector:', selector, '→', text)
            return text
          }
        }
      }

      // PRIORITY 2: Look for the main profile name (must be in TOP profile header area)
      const largeTexts = []
      const allElements = document.querySelectorAll('*')

      for (const element of allElements) {
        const text = element.textContent?.trim()
        if (!text || element.children.length > 1) continue

        const rect = element.getBoundingClientRect()
        const fontSize = parseFloat(window.getComputedStyle(element).fontSize)
        const tagName = element.tagName.toLowerCase()

        // STRICT CRITERIA: Must be in the profile header area (top 350px, left side)
        // This excludes content from posts, activity feed, and recommendations
        const isInProfileHeader = rect.top > 80 && rect.top < 350 && rect.left > 0 && rect.left < 700
        const isLargeText = fontSize > 24
        const isHeading = tagName === 'h1'

        if (isInProfileHeader && (isLargeText || isHeading)) {
          // Check if it looks like a name (handles "First Last" or "First L.")
          if (text.match(/^[A-Z][a-z]+(\s+[A-Z]\.?)?\s+[A-Z][a-z-]+(\s+[A-Z][a-z-]+)*$/)) {
            largeTexts.push({ text, fontSize, element, rect, tagName })
          }
        }
      }

      // Sort by: 1) h1 tags first, 2) higher position (smaller top), 3) font size
      largeTexts.sort((a, b) => {
        if (a.tagName === 'h1' && b.tagName !== 'h1') return -1
        if (a.tagName !== 'h1' && b.tagName === 'h1') return 1
        if (Math.abs(a.rect.top - b.rect.top) > 50) return a.rect.top - b.rect.top
        return b.fontSize - a.fontSize
      })

      console.log('Found large name candidates:', largeTexts.slice(0, 3).map(t => ({
        text: t.text,
        fontSize: t.fontSize,
        top: Math.round(t.rect.top),
        tag: t.tagName
      })))

      return largeTexts.length > 0 ? largeTexts[0].text : null
    }

    findJobInformation() {
      console.log('🔍 Looking for job information...')

      const result = { headline: null, company: null, title: null }

      // PRIORITY 1: Try known headline selectors
      const headlineSelectors = [
        '.text-body-medium.break-words', // Current headline format
        'div.text-body-medium:not([class*="mt"])', // Headline without top margin
        'main section:first-of-type .text-body-medium', // First section headline
        '.pv-top-card-profile-picture + div .text-body-medium' // Next to profile picture
      ]

      for (const selector of headlineSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          const text = element.textContent?.trim()
          // Verify it's not the name itself
          if (text && text.length > 10 && text.length < 200 && !text.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/)) {
            console.log('✅ Found headline via known selector:', selector, '→', text)
            result.headline = text
            const exp = this.parseHeadlineForExperience(text)
            if (exp) {
              result.company = exp.company
              result.title = exp.title
            }
            return result
          }
        }
      }

      // PRIORITY 2: Look for text that contains "at" which often indicates "Title at Company"
      const jobElements = []
      const allElements = document.querySelectorAll('*')

      for (const element of allElements) {
        const text = element.textContent?.trim()
        if (!text || element.children.length > 1) continue

        const rect = element.getBoundingClientRect()
        const fontSize = parseFloat(window.getComputedStyle(element).fontSize)

        // STRICT: Only look in the profile header area (not in posts/activity)
        if (fontSize >= 14 && fontSize <= 20 && rect.top > 200 && rect.top < 400 && rect.left > 0 && rect.left < 700) {
          // Check if it looks like a job title
          if (text.includes(' at ') || text.includes(' & ') ||
              text.match(/^(Co-)?Founder/i) || text.match(/^(Chief|Senior|Lead|Principal|Director|Manager)/i)) {
            jobElements.push({ text, fontSize, element, rect })
          }
        }
      }

      // Sort by position (higher up first, then by font size)
      jobElements.sort((a, b) => a.rect.top - b.rect.top || b.fontSize - a.fontSize)
      
      console.log('Found job candidates:', jobElements.slice(0, 3).map(j => ({ text: j.text, fontSize: j.fontSize })))
      
      if (jobElements.length > 0) {
        const jobText = jobElements[0].text
        result.headline = jobText
        
        // Try to parse title and company from the job text
        const parsed = this.parseHeadlineForExperience(jobText)
        if (parsed) {
          result.title = parsed.title
          result.company = parsed.company
        }
      }
      
      return result
    }

    debugPageStructure() {
      console.log('=== LinkedIn Page Structure Debug ===')
      
      // Debug main sections
      const main = document.querySelector('main')
      if (main) {
        console.log('Main element found')
        const mainChildren = main.children
        for (let i = 0; i < Math.min(mainChildren.length, 5); i++) {
          const child = mainChildren[i]
          console.log(`Main child ${i}:`, child.tagName, child.className, child.textContent.slice(0, 50))
        }
      } else {
        console.log('No main element found')
      }
      
      // Debug all h1 elements
      const h1s = document.querySelectorAll('h1')
      console.log(`Found ${h1s.length} h1 elements:`)
      h1s.forEach((h1, i) => {
        console.log(`H1 ${i}:`, h1.textContent.trim(), 'Classes:', h1.className)
      })
      
      // Debug text elements that might contain names/headlines
      const textElements = document.querySelectorAll('.text-heading-xlarge, .text-body-medium, [class*="text-"]')
      console.log(`Found ${textElements.length} text elements:`)
      textElements.forEach((el, i) => {
        if (i < 10) { // Limit output
          console.log(`Text ${i}:`, el.className, el.textContent.trim().slice(0, 50))
        }
      })
      
      console.log('=== End Debug ===')
    }

    extractName () {
      console.log('🔍 Dynamic name extraction starting...')
      
      // PRIORITIZE dynamic discovery to avoid UI element contamination
      const dynamicResult = this.dynamicNameDiscovery()
      if (dynamicResult && this.validateAsRealName(dynamicResult)) {
        console.log('✅ Found name via dynamic discovery:', dynamicResult)
        return dynamicResult
      }
      
      // Try known selectors as fallback only
      const quickResult = this.quickSelectorTry([
        'h1[data-anonymize="person-name"]',
        '.text-heading-xlarge',
        'main h1',
        '.pv-text-details__left-panel h1'
      ])
      
      if (quickResult && this.validateAsRealName(quickResult)) {
        console.log('✅ Found name via quick selector:', quickResult)
        return quickResult
      }

      console.log('❌ No valid name found')
      return ''
    }

    validateAsRealName(text) {
      if (!text || typeof text !== 'string') return false
      
      // Extremely strict validation to prevent UI elements
      const lowercaseText = text.toLowerCase().trim()
      
      // Hard block common UI elements
      const blockedWords = ['my', 'network', 'message', 'more', 'follow', 'connect', 'linkedin', 
                           'profile', 'about', 'experience', 'education', 'home', 'notifications',
                           'jobs', 'messaging', 'premium', 'work', 'insights', 'search']
      
      // If it's exactly a blocked word or starts/ends with one, reject
      for (const blocked of blockedWords) {
        if (lowercaseText === blocked || 
            lowercaseText.startsWith(blocked + ' ') || 
            lowercaseText.endsWith(' ' + blocked)) {
          console.log(`❌ Rejected name "${text}" - contains blocked word "${blocked}"`)
          return false
        }
      }
      
      // Must look like a real person's name
      if (!text.match(/^[A-Z][a-z]+ [A-Z][a-z-]+(\s+[A-Z][a-z-]+)*$/)) {
        console.log(`❌ Rejected name "${text}" - doesn't match name pattern`)
        return false
      }
      
      // Additional length checks
      if (text.length < 6 || text.length > 50) {
        console.log(`❌ Rejected name "${text}" - invalid length`)
        return false
      }
      
      console.log(`✅ Validated name "${text}"`)
      return true
    }

    dynamicNameDiscovery() {
      console.log('🧠 Starting dynamic name discovery...')
      
      const candidates = []
      
      // Analyze all text elements and score them as potential names
      const allElements = document.querySelectorAll('*')
      
      for (const element of allElements) {
        const text = element.textContent?.trim()
        if (!text || element.children.length > 1) continue // Skip containers with multiple children
        
        const score = this.scoreAsName(text, element)
        if (score > 0) {
          candidates.push({ text, element, score, type: 'name' })
        }
      }
      
      // Sort by score (highest first)
      candidates.sort((a, b) => b.score - a.score)
      
      console.log('Name candidates found:', candidates.slice(0, 5).map(c => ({ text: c.text, score: c.score })))
      
      // Return the highest-scoring candidate
      return candidates.length > 0 ? candidates[0].text : ''
    }

    scoreAsName(text, element) {
      if (!text || text.length < 3 || text.length > 60) return 0
      
      let score = 0
      
      // Strong negative filters for UI elements that shouldn't be names
      const lowercaseText = text.toLowerCase()
      const uiKeywords = ['my', 'network', 'message', 'more', 'follow', 'connect', 'linkedin', 
                         'profile', 'about', 'experience', 'education', 'skills', 'endorsements',
                         'recommendations', 'activity', 'contact', 'info', 'see', 'all', 'view',
                         'premium', 'hire', 'hiring', 'recruiting', 'job', 'open', 'work', 'learn']
      
      // If text is a common UI keyword, heavily penalize
      if (uiKeywords.includes(lowercaseText)) {
        return 0
      }
      
      // If text contains common UI phrases, penalize
      if (lowercaseText.includes('connection') || lowercaseText.includes('mutual') || 
          lowercaseText.includes('other') || lowercaseText.includes('people') ||
          lowercaseText.includes('hiring') || lowercaseText.includes('recruiting')) {
        return 0
      }
      
      // Pattern matching for names (stronger patterns get higher scores)
      if (text.match(/^[A-Z][a-z]+ [A-Z][a-z]+(-[A-Z][a-z]+)*$/)) score += 60 // "First Last-Name"
      if (text.match(/^[A-Z][a-z]+ [A-Z][a-z]+(\s+[A-Z][a-z]+)*$/)) score += 55 // "First Last" or "First Middle Last"
      if (text.match(/^[A-Z][a-z]+\s+[A-Z]\.?\s+[A-Z][a-z]+$/)) score += 50 // "First M. Last"
      if (text.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+$/)) score += 45 // Simple "First Last"
      
      // Must look like a person's name to get any points
      if (score === 0) return 0
      
      // Heading elements are more likely to be names
      const tagName = element.tagName.toLowerCase()
      if (tagName === 'h1') score += 35
      if (tagName === 'h2') score += 25
      if (tagName === 'h3') score += 15
      
      // Position-based scoring (profile names are usually in specific areas)
      // STRICT: Only the top profile header area, NOT the activity feed or posts
      const rect = element.getBoundingClientRect()
      if (rect.top > 80 && rect.top < 350 && rect.left > 0 && rect.left < 700) {
        score += 40 // Main profile header area
      } else if (rect.top > 350) {
        score -= 30 // Penalize content below profile header (posts, activity, etc.)
      }
      if (rect.top < 250) score += 20 // Very top portion (where main profile is)
      
      // Font size (larger text more likely to be names)
      const fontSize = parseFloat(window.getComputedStyle(element).fontSize)
      if (fontSize > 28) score += 20 // Very large text
      if (fontSize > 20) score += 15 // Large text
      if (fontSize > 16) score += 10 // Medium-large text
      
      // Class name hints (be more selective)
      const className = element.className?.toLowerCase() || ''
      if (className.includes('profile') && className.includes('name')) score += 30
      if (className.includes('heading') && className.includes('xlarge')) score += 25
      if (className.includes('text-heading-xlarge')) score += 20
      
      // Check if element is in main profile area (not sidebar, header, etc.)
      const elementRect = element.getBoundingClientRect()
      const isInMainArea = elementRect.left > 80 && elementRect.left < 800 && 
                          elementRect.top > 100 && elementRect.top < 600
      if (isInMainArea) score += 15
      
      // Negative scoring for various issues
      if (text.includes('@')) score -= 50 // Email
      if (text.includes('http')) score -= 50 // URL
      if (text.match(/\d{3}/)) score -= 30 // Contains numbers
      if (text.length < 8) score -= 10 // Very short (likely not full name)
      
      // Check if this text appears in navigation or UI areas
      const parent = element.parentElement
      if (parent) {
        const parentClass = parent.className?.toLowerCase() || ''
        if (parentClass.includes('nav') || parentClass.includes('menu') || 
            parentClass.includes('sidebar') || parentClass.includes('footer')) {
          score -= 40
        }
      }
      
      // Uniqueness (names should be relatively unique on the page)
      const occurrences = document.body.textContent.split(text).length - 1
      if (occurrences > 2) score -= 20
      if (occurrences > 5) score -= 50
      
      return Math.max(0, score)
    }

    quickSelectorTry(selectors) {
      for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (element && element.textContent.trim()) {
          return element.textContent.trim()
        }
      }
      return null
    }

    extractHeadline () {
      console.log('🔍 Dynamic headline extraction starting...')
      
      // PRIORITIZE dynamic discovery to avoid promotional text
      const dynamicResult = this.dynamicHeadlineDiscovery()
      if (dynamicResult && this.validateAsRealHeadline(dynamicResult)) {
        console.log('✅ Found headline via dynamic discovery:', dynamicResult)
        return dynamicResult
      }
      
      // Try known selectors as fallback only
      const quickResult = this.quickSelectorTry([
        '[data-anonymize="headline"]',
        '.text-body-medium.break-words',
        '.pv-text-details__left-panel .text-body-medium'
      ])
      
      if (quickResult && this.validateAsRealHeadline(quickResult)) {
        console.log('✅ Found headline via quick selector:', quickResult)
        return quickResult
      }

      console.log('❌ No valid headline found')
      return ''
    }

    validateAsRealHeadline(text) {
      if (!text || typeof text !== 'string') return false
      if (this.isConnectionsText(text)) return false
      
      const lowercaseText = text.toLowerCase()
      
      // Block promotional/UI text
      const promoKeywords = ['hiring', 'recruiting', 'looking for', 'we\'re hiring', 'join us',
                           'apply now', 'career', 'opportunity', 'premium', 'learn more',
                           'upgrade', 'try', 'see all', 'view', 'connect', 'follow',
                           'message', 'network', 'profile', 'linkedin']
      
      for (const keyword of promoKeywords) {
        if (lowercaseText.includes(keyword)) {
          console.log(`❌ Rejected headline "${text}" - contains promotional keyword "${keyword}"`)
          return false
        }
      }
      
      // Must contain job-related content
      const jobKeywords = ['engineer', 'manager', 'director', 'developer', 'analyst', 'consultant', 
                          'specialist', 'coordinator', 'executive', 'lead', 'senior', 'junior',
                          'architect', 'designer', 'researcher', 'scientist', 'professor', 'ceo',
                          'cto', 'cfo', 'founder', 'co-founder', 'owner', 'president', 'vice president']
      
      const hasJobKeyword = jobKeywords.some(keyword => lowercaseText.includes(keyword))
      const hasJobPattern = text.includes(' at ') || text.includes(' & ')
      
      if (!hasJobKeyword && !hasJobPattern) {
        console.log(`❌ Rejected headline "${text}" - no job keywords or patterns`)
        return false
      }
      
      console.log(`✅ Validated headline "${text}"`)
      return true
    }

    dynamicHeadlineDiscovery() {
      console.log('🧠 Starting dynamic headline discovery...')
      
      const candidates = []
      const allElements = document.querySelectorAll('*')
      
      for (const element of allElements) {
        const text = element.textContent?.trim()
        if (!text || element.children.length > 1) continue
        
        const score = this.scoreAsHeadline(text, element)
        if (score > 0) {
          candidates.push({ text, element, score, type: 'headline' })
        }
      }
      
      // Sort by score (highest first)
      candidates.sort((a, b) => b.score - a.score)
      
      console.log('Headline candidates found:', candidates.slice(0, 5).map(c => ({ text: c.text, score: c.score })))
      
      return candidates.length > 0 ? candidates[0].text : ''
    }

    scoreAsHeadline(text, element) {
      if (!text || text.length < 10 || text.length > 200) return 0
      if (this.isConnectionsText(text)) return 0
      
      let score = 0
      const lowercaseText = text.toLowerCase()
      
      // Strong negative filters for promotional/UI text
      const promoKeywords = ['hiring', 'recruiting', 'looking for', 'we\'re hiring', 'join us',
                           'apply now', 'career', 'opportunity', 'premium', 'learn more',
                           'upgrade', 'try', 'see all', 'view', 'connect', 'follow',
                           'message', 'network', 'profile', 'linkedin', 'premium']
      
      // If text contains promotional keywords, heavily penalize
      for (const keyword of promoKeywords) {
        if (lowercaseText.includes(keyword)) {
          return 0
        }
      }
      
      // Check for promotional symbols/characters that indicate it's not a job title
      if (text.includes('!') || text.includes('$') || text.includes('%') || 
          text.includes('→') || text.includes('•') && text.includes('hiring')) {
        return 0
      }
      
      // Job title patterns - these should be the main way headlines get points
      if (text.match(/^[A-Z][a-zA-Z\s&]+ at [A-Z][a-zA-Z\s&,\.]+$/)) score += 50 // "Title at Company"
      if (text.includes(' at ') && !lowercaseText.includes('hiring')) score += 45
      if (text.includes(' & ') && (lowercaseText.includes('founder') || lowercaseText.includes('ceo'))) score += 40
      if (text.match(/^(Co-)?Founder/i)) score += 35
      if (text.match(/^(Chief|Senior|Lead|Principal|Head of)/i)) score += 30
      
      // Job keywords (must be actual job titles, not promotional text)
      const jobTitles = ['engineer', 'manager', 'director', 'developer', 'analyst', 'consultant', 
                        'specialist', 'coordinator', 'executive', 'lead', 'senior', 'junior',
                        'architect', 'designer', 'researcher', 'scientist', 'professor', 'ceo',
                        'cto', 'cfo', 'founder', 'co-founder', 'owner', 'president', 'vice president',
                        'vp', 'head of', 'chief', 'principal', 'staff']
      
      let hasJobTitle = false
      for (const title of jobTitles) {
        if (lowercaseText.includes(title)) {
          score += 20
          hasJobTitle = true
          break // Only count once
        }
      }
      
      // Must contain job-related keywords to be considered a headline
      if (score < 20 && !hasJobTitle) return 0
      
      // Position-based scoring (headlines appear below name, in profile area)
      const rect = element.getBoundingClientRect()
      if (rect.top > 200 && rect.top < 500 && rect.left > 50 && rect.left < 600) score += 20
      if (rect.top > 100 && rect.top < 400) score += 10
      
      // Font size (medium-sized text, not too large like names, not too small like body text)
      const fontSize = parseFloat(window.getComputedStyle(element).fontSize)
      if (fontSize >= 15 && fontSize <= 19) score += 15 // Sweet spot for job titles
      if (fontSize >= 14 && fontSize <= 20) score += 10
      if (fontSize > 22) score -= 10 // Too large, likely a name
      if (fontSize < 13) score -= 5 // Too small, likely body text
      
      // Class name hints (be more specific)
      const className = element.className?.toLowerCase() || ''
      if (className.includes('headline')) score += 25
      if (className.includes('text-body-medium')) score += 15
      if (className.includes('subtitle') || className.includes('description')) score += 10
      
      // Element context - should be in main profile area
      const isInMainProfileArea = rect.left > 80 && rect.left < 700 && 
                                 rect.top > 150 && rect.top < 600
      if (isInMainProfileArea) score += 15
      
      // Element type preferences
      const tagName = element.tagName.toLowerCase()
      if (tagName === 'div' && className.includes('text')) score += 8
      if (tagName === 'span' && className.includes('medium')) score += 6
      if (tagName === 'p') score += 5
      
      // Strong negative scoring for various issues
      if (text.includes('@')) score -= 40 // Email
      if (text.includes('http')) score -= 40 // URL
      if (text.match(/\d{4,}/)) score -= 30 // Long numbers (years, phone numbers)
      if (text.includes('connections')) score -= 50 // Connection count
      if (text.length > 100) score -= 20 // Too long for a typical job title
      
      // Check if in promotional/advertising context
      const parent = element.parentElement
      if (parent) {
        const parentClass = parent.className?.toLowerCase() || ''
        if (parentClass.includes('ad') || parentClass.includes('promo') || 
            parentClass.includes('banner') || parentClass.includes('sidebar')) {
          score -= 40
        }
      }
      
      return Math.max(0, score)
    }

    isConnectionsText(text) {
      const lowerText = text.toLowerCase()
      return lowerText.includes('connection') || 
             lowerText.includes('follower') || 
             lowerText.includes('mutual')
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
      console.log('🔍 Dynamic experience extraction starting...')
      
      // First try traditional experience section extraction
      const traditionalExperiences = this.extractTraditionalExperience()
      if (traditionalExperiences.length > 0) {
        console.log('✅ Found experiences via traditional method:', traditionalExperiences.length)
        return traditionalExperiences
      }

      // Dynamic discovery as fallback
      return this.dynamicExperienceDiscovery()
    }

    extractTraditionalExperience() {
      const experiences = []
      const experienceSelectors = [
        'section[data-section="experienceSection"] .pvs-entity',
        'section[data-section="experience"] .pvs-entity',
        '[data-view-name="profile-experience"] .pvs-entity',
        '.experience-section .pvs-entity',
        '.pvs-list .pvs-entity'
      ]

      for (const selector of experienceSelectors) {
        const elements = document.querySelectorAll(selector)
        if (elements.length === 0) continue

        console.log(`Found ${elements.length} potential experience elements with: ${selector}`)
        
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const element = elements[i]
          const experience = this.parseExperienceElement(element)
          if (experience) {
            experiences.push(experience)
          }
        }

        if (experiences.length > 0) break
      }

      return experiences
    }

    parseExperienceElement(element) {
      // Try multiple strategies to extract title and company
      const titleSelectors = ['h3', '[aria-hidden="true"]', '.t-bold', '.pvs-entity__caption-wrapper *']
      const companySelectors = ['.t-14', '.t-normal', '.pv-entity__secondary-title', 'span:not(h3)']
      
      let title = null
      let company = null

      // Find title
      for (const selector of titleSelectors) {
        const titleEl = element.querySelector(selector)
        if (titleEl && titleEl.textContent.trim()) {
          title = titleEl.textContent.trim()
          break
        }
      }

      // Find company (different from title)
      for (const selector of companySelectors) {
        const companyEl = element.querySelector(selector)
        if (companyEl && companyEl.textContent.trim() && 
            companyEl.textContent.trim() !== title &&
            !this.isConnectionsText(companyEl.textContent)) {
          company = companyEl.textContent.trim()
          break
        }
      }

      return (title && company) ? { title, company } : null
    }

    dynamicExperienceDiscovery() {
      console.log('🧠 Starting dynamic experience discovery...')
      
      // Try to extract from headline first
      const headline = this.data?.headline || this.extractHeadline()
      if (headline) {
        const experienceFromHeadline = this.parseHeadlineForExperience(headline)
        if (experienceFromHeadline) {
          console.log('✅ Extracted experience from headline:', experienceFromHeadline)
          return [experienceFromHeadline]
        }
      }

      // Analyze page for job-related content patterns
      const experiences = []
      const allElements = document.querySelectorAll('*')
      
      for (const element of allElements) {
        const text = element.textContent?.trim()
        if (!text || element.children.length > 2) continue
        
        const experience = this.extractExperienceFromText(text)
        if (experience) {
          experiences.push(experience)
          if (experiences.length >= 3) break // Limit to avoid noise
        }
      }

      console.log('Dynamic experience candidates:', experiences)
      return experiences
    }

    parseHeadlineForExperience(headline) {
      // Try different patterns, prioritizing more specific ones first
      const patterns = [
        // "Co-Founder & CEO at Standard Metrics"
        { regex: /^(.+?)\s+at\s+(.+)$/i, titleIndex: 1, companyIndex: 2 },
        // "Title | Company"
        { regex: /^(.+?)\s+\|\s+(.+)$/i, titleIndex: 1, companyIndex: 2 },
        // "Title • Company"
        { regex: /^(.+?)\s+•\s+(.+)$/i, titleIndex: 1, companyIndex: 2 },
        // "Title, Company"
        { regex: /^(.+?),\s+(.+)$/i, titleIndex: 1, companyIndex: 2 },
        // "Title - Company"
        { regex: /^(.+?)\s+-\s+(.+)$/i, titleIndex: 1, companyIndex: 2 }
      ]

      console.log(`🔍 Parsing headline: "${headline}"`)

      for (const pattern of patterns) {
        const match = headline.match(pattern.regex)
        if (match && match[pattern.titleIndex] && match[pattern.companyIndex]) {
          const title = match[pattern.titleIndex].trim()
          const company = match[pattern.companyIndex].trim()
          
          // Validate that company doesn't look like promotional text
          if (!this.looksLikePromotionalText(company)) {
            console.log(`✅ Parsed: Title="${title}", Company="${company}"`)
            return { title, company }
          }
        }
      }

      console.log(`❌ Could not parse headline`)
      return null
    }

    looksLikePromotionalText(text) {
      const lowercaseText = text.toLowerCase()
      const promoIndicators = ['hiring', 'recruiting', 'we\'re', 'looking for', 'join us', 
                              '!', 'apply', 'career', 'opportunity', 'premium']
      
      return promoIndicators.some(indicator => lowercaseText.includes(indicator))
    }

    extractExperienceFromText(text) {
      // Look for "Title at Company" patterns in any text
      if (text.length > 200 || text.length < 15) return null
      if (this.isConnectionsText(text)) return null
      
      const experience = this.parseHeadlineForExperience(text)
      if (experience) {
        // Validate that it looks like a real job
        const hasJobKeyword = ['engineer', 'manager', 'director', 'developer', 'analyst', 
                              'consultant', 'specialist', 'coordinator', 'executive'].some(keyword => 
          experience.title.toLowerCase().includes(keyword)
        )
        
        if (hasJobKeyword || experience.title.match(/\b(senior|junior|lead|principal|chief)\b/i)) {
          return experience
        }
      }

      return null
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
      // Handle extraction asynchronously to prevent channel closing
      handleLinkedInExtraction(sendResponse)
      return true // Keep message channel open for async response
    }

    if (request.action === 'triggerPdfDownload') {
      // Handle PDF download trigger
      handlePdfDownloadTrigger(sendResponse)
      return true // Keep message channel open for async response
    }

    return false // Don't keep channel open for other messages
  })

  async function handleLinkedInExtraction(sendResponse) {
    try {
      console.log('🚀 Starting LinkedIn extraction...')
      
      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Force fresh extraction
      const data = linkedInExtractor.extractProfileData()
      const preview = linkedInExtractor.formatForDisplay()

      console.log('LinkedIn extraction results:', { data, preview })

      // More lenient content checking
      const hasName = data && data.name && data.name.length > 0
      const hasHeadline = data && data.headline && data.headline.length > 0
      const hasAnyContent = hasName || hasHeadline || (data && data.about) || (data && data.experience && data.experience.length > 0)

      console.log('Content check:', { hasName, hasHeadline, hasAnyContent, previewLength: preview ? preview.length : 0 })

      const response = {
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
      }

      console.log('✅ Sending response:', response)
      sendResponse(response)

    } catch (error) {
      console.error('❌ LinkedIn extraction error:', error)
      const errorResponse = { 
        success: false, 
        error: error.message,
        data: {},
        preview: 'Error: ' + error.message,
        source: 'linkedin'
      }
      
      console.log('❌ Sending error response:', errorResponse)
      sendResponse(errorResponse)
    }
  }

  async function handlePdfDownloadTrigger(sendResponse) {
    try {
      console.log('📄 Attempting to trigger LinkedIn PDF download...')

      // Human-like delay before starting (simulate reading/thinking)
      await randomDelay(300, 800)

      // Find the "More" button (looks for common selectors)
      const moreButtonSelectors = [
        'button[aria-label*="More actions"]',
        'button[aria-label*="More"]',
        'button.artdeco-dropdown__trigger--placement-bottom',
        '[data-control-name="more_actions"]',
        'button:has-text("More")'
      ]

      let moreButton = null
      for (const selector of moreButtonSelectors) {
        moreButton = document.querySelector(selector)
        if (moreButton) {
          console.log('✓ Found More button using selector:', selector)
          break
        }
      }

      if (!moreButton) {
        throw new Error('Could not find "More" button on profile page')
      }

      // Simulate mouse movement to the button
      await simulateHumanHover(moreButton)

      // Human-like delay before clicking (simulate mouse positioning)
      await randomDelay(100, 300)

      // Click the More button with human-like behavior
      console.log('Clicking More button...')
      await humanLikeClick(moreButton)

      // Wait for dropdown to appear (with slight randomness)
      await randomDelay(400, 700)

      // Find the "Save to PDF" option in the dropdown
      const pdfButtonSelectors = [
        'a[href*="save-to-pdf"]',
        'a:has-text("Save to PDF")',
        '[data-control-name="save_to_pdf"]',
        'div.artdeco-dropdown__item:has-text("Save to PDF")',
        'a[data-control-name="save_to_pdf"]'
      ]

      let pdfButton = null
      for (const selector of pdfButtonSelectors) {
        // Try to find by text content
        const elements = document.querySelectorAll('a, button, div')
        for (const elem of elements) {
          if (elem.textContent.includes('Save to PDF')) {
            pdfButton = elem
            console.log('✓ Found PDF button by text content')
            break
          }
        }
        if (pdfButton) break

        // Try selector
        pdfButton = document.querySelector(selector)
        if (pdfButton) {
          console.log('✓ Found PDF button using selector:', selector)
          break
        }
      }

      if (!pdfButton) {
        throw new Error('Could not find "Save to PDF" option in dropdown')
      }

      // Simulate mouse movement to PDF button
      await simulateHumanHover(pdfButton)

      // Human-like delay before clicking (simulate reading the option)
      await randomDelay(200, 500)

      // Click the PDF button with human-like behavior
      console.log('Clicking Save to PDF button...')
      await humanLikeClick(pdfButton)

      // Small delay to ensure download starts
      await randomDelay(100, 200)

      console.log('✓ PDF download triggered successfully')
      sendResponse({
        success: true,
        message: 'PDF download triggered'
      })

    } catch (error) {
      console.error('❌ PDF download trigger error:', error)
      sendResponse({
        success: false,
        error: error.message
      })
    }
  }

  // Human-like behavior helper functions
  function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  async function simulateHumanHover(element) {
    // Dispatch mouse events to simulate hovering
    const rect = element.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // Dispatch mouseenter and mouseover events
    element.dispatchEvent(new MouseEvent('mouseenter', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    }))

    element.dispatchEvent(new MouseEvent('mouseover', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    }))

    // Brief pause to simulate hover
    await randomDelay(50, 150)
  }

  async function humanLikeClick(element) {
    // Simulate a more realistic click sequence
    const rect = element.getBoundingClientRect()
    const x = rect.left + rect.width / 2 + (Math.random() * 4 - 2) // Add slight randomness
    const y = rect.top + rect.height / 2 + (Math.random() * 4 - 2)

    // Dispatch mousedown
    element.dispatchEvent(new MouseEvent('mousedown', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0
    }))

    // Small delay between mousedown and mouseup (human reaction time)
    await randomDelay(50, 120)

    // Dispatch mouseup
    element.dispatchEvent(new MouseEvent('mouseup', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0
    }))

    // Dispatch click
    element.dispatchEvent(new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0
    }))

    // Also try the native click as fallback
    element.click()
  }

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
