class StyleRules {
  static enforce (emailContent, rules = {}) {
    if (!emailContent || typeof emailContent !== 'string') {
      return emailContent
    }

    let processed = emailContent

    // Apply each rule if enabled
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
    // Split by sentence-ending punctuation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    if (sentences.length <= maxSentences) {
      return text
    }

    // Take first maxSentences and rejoin
    const limitedSentences = sentences.slice(0, maxSentences)

    // Try to preserve original punctuation pattern
    let result = ''
    // const sentenceIndex = 0 // Unused variable
    const originalPunctuation = text.match(/[.!?]+/g) || []

    for (let i = 0; i < limitedSentences.length; i++) {
      result += limitedSentences[i].trim()

      if (i < originalPunctuation.length) {
        // Use original punctuation, but default to period
        const punct = originalPunctuation[i] || '.'
        result += punct.charAt(0) // Take first character of punctuation
      } else {
        result += '.'
      }

      // Add space if not the last sentence
      if (i < limitedSentences.length - 1) {
        result += ' '
      }
    }

    return result
  }

  static enforceParagraphLimit (text, maxParagraphs = 2) {
    // Split by double newlines or multiple newlines
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)

    if (paragraphs.length <= maxParagraphs) {
      return text
    }

    // Take first maxParagraphs
    const limitedParagraphs = paragraphs.slice(0, maxParagraphs)

    // Rejoin with double newlines
    return limitedParagraphs.map(p => p.trim()).join('\n\n')
  }

  static replaceEmDashes (text) {
    // Replace em dashes (—) and double hyphens (--) with periods or commas
    return text
      .replace(/\s*—\s*/g, ', ') // Em dash to comma with space
      .replace(/\s*--\s*/g, ', ') // Double hyphen to comma with space
      .replace(/,,+/g, ',') // Clean up multiple commas
      .replace(/\s*,\s*([.!?])/g, '$1') // Remove comma before sentence endings
      .replace(/,\s*,/g, ',') // Clean up double commas
  }

  static appendPlaceholders (text, placeholders = {}) {
    if (!text) return text

    let result = text.trim()

    // Ensure text ends with proper punctuation
    if (!result.match(/[.!?]$/)) {
      result += '.'
    }

    // Add calendar link if provided
    if (placeholders.calendarLink) {
      result += `\n\nCalendar: ${placeholders.calendarLink}`
    }

    // Add bio if provided
    if (placeholders.bio) {
      result += `\n\n${placeholders.bio}`
    }

    return result
  }

  static validateRules (emailContent, rules = {}) {
    const violations = []

    if (rules.maxSentences) {
      const sentenceCount = this.countSentences(emailContent)
      if (sentenceCount > 6) {
        violations.push(`Too many sentences: ${sentenceCount} (max: 6)`)
      }
    }

    if (rules.maxParagraphs) {
      const paragraphCount = this.countParagraphs(emailContent)
      if (paragraphCount > 2) {
        violations.push(`Too many paragraphs: ${paragraphCount} (max: 2)`)
      }
    }

    if (rules.noEmDashes) {
      if (emailContent.includes('—') || emailContent.includes('--')) {
        violations.push('Contains em dashes or double hyphens')
      }
    }

    return violations
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

  static generateStats (text) {
    return {
      sentences: this.countSentences(text),
      paragraphs: this.countParagraphs(text),
      words: this.countWords(text),
      characters: text ? text.length : 0
    }
  }
}

// For use in both content scripts and background
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StyleRules
}

// For use in Chrome extension service workers
if (typeof self !== 'undefined') {
  self.StyleRules = StyleRules
}
