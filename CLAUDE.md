# One-Click Outreach Chrome Extension

## Project Overview
The One-Click Outreach Chrome Extension is designed to streamline the process of writing personalized outreach emails directly from LinkedIn profiles or any webpage. It eliminates the need for constant copy/paste and context-switching between tools by extracting relevant profile information, allowing users to specify their intent, and generating professional, concise draft emails using AI.

## Key Features
- **One-click extraction**: Automatically extract profile information from LinkedIn or generic webpage content
- **AI-powered generation**: Uses Anthropic Claude or OpenAI GPT to generate personalized emails
- **Consistent styling**: Enforces strict rules (max 6 sentences, 1-2 paragraphs, no em dashes)
- **Customizable templates**: Include user's calendar link and bio automatically
- **Fast workflow**: Complete process takes less than a minute

## Architecture
The extension consists of three main components:

1. **Content Scripts**: Extract structured data from LinkedIn profiles and generic webpages
2. **Background Service Worker**: Handles AI API calls, prompt construction, and style rule enforcement
3. **User Interface**: Popup for quick interactions and options page for configuration

## Development Commands
- Build: `npm run build` (when implemented)
- Test: `npm test` (when implemented)
- Lint: `npm run lint` (when implemented)

## File Structure
```
/
├── manifest.json           # Extension manifest
├── src/
│   ├── content/           # Content scripts
│   │   ├── linkedin.js    # LinkedIn-specific extractor
│   │   └── generic.js     # Generic webpage extractor
│   ├── background/        # Service worker
│   │   └── service-worker.js
│   ├── popup/            # Extension popup
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/          # Settings page
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   └── utils/            # Shared utilities
│       └── rules.js      # Style rule enforcement
├── package.json          # Dependencies and scripts
└── README.md            # Project documentation
```

## Style Rules (Non-negotiable)
- Maximum 6 sentences total
- Limited to 1-2 short paragraphs
- Absolutely no em dashes (replace with periods or commas)
- Always include user's calendar link if configured
- Always include user's one-line bio if configured

## API Integration
The extension supports both:
- **Anthropic Claude**: Recommended for high-quality, concise outputs
- **OpenAI GPT**: Alternative option for users with existing API access

## Security Considerations
- API keys stored securely in Chrome storage
- No data sent to external servers except AI providers
- Content scripts run in isolated environments
- Proper HTTPS enforcement for all API calls

## Testing Strategy
1. Test LinkedIn profile extraction on various profile types
2. Test generic webpage extraction on different sites
3. Verify AI integration with both Claude and GPT
4. Validate style rule enforcement
5. Test complete user workflow end-to-end

## Future Enhancements
- Direct injection into Gmail/Outlook
- Template library with analytics
- CRM integration (Notion, Airtable)
- Automatic follow-up reminders
- Team collaboration features