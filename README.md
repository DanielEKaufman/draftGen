# One-Click Outreach Chrome Extension

A Chrome extension that streamlines personalized outreach email generation directly from LinkedIn profiles and webpages using AI.

## Features

- 🚀 **One-Click Generation**: Extract profile data and generate personalized emails in seconds
- 🤖 **AI-Powered**: Uses Anthropic Claude or OpenAI GPT for intelligent email composition
- 📏 **Consistent Style**: Enforces professional formatting (max 6 sentences, 1-2 paragraphs)
- 🔗 **Auto-Include**: Automatically adds your calendar link and bio to emails
- 🎯 **LinkedIn Optimized**: Specifically designed for LinkedIn profile extraction
- 🌐 **Generic Support**: Works on any webpage with extractable content

## Quick Start

### Installation for Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd one-click-outreach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `src/` folder from this project

### Setup

1. **Configure API Key**
   - Click the extension icon in your toolbar
   - Go to "Options" 
   - Add your Anthropic Claude or OpenAI API key
   - Configure your calendar link and bio

2. **Test the Extension**
   - Visit any LinkedIn profile
   - Click the extension icon
   - Type your message intent (e.g., "Introductory note, ask for 15-minute call")
   - Click "Generate" and copy the result

## How It Works

1. **Extract**: Content scripts extract profile information from the current page
2. **Process**: Background service worker sends data to AI with structured prompts
3. **Generate**: AI returns a personalized, professional email draft
4. **Enforce**: Style rules are applied to ensure consistency
5. **Copy**: User copies the final draft to their email client

## API Support

### Anthropic Claude (Recommended)
- Higher quality outputs
- Better adherence to style constraints
- More reliable formatting

### OpenAI GPT
- Alternative option for existing API users
- Good performance with proper prompting

## Style Rules

All generated emails follow these non-negotiable rules:
- ✅ Maximum 6 sentences
- ✅ 1-2 paragraphs only
- ✅ No em dashes (replaced with periods/commas)
- ✅ Include calendar link (if configured)
- ✅ Include user bio (if configured)

## File Structure

```
/
├── manifest.json           # Extension configuration
├── src/
│   ├── content/           # Content extraction scripts
│   │   ├── linkedin.js    # LinkedIn profile extractor
│   │   └── generic.js     # Generic webpage extractor
│   ├── background/        # Background processing
│   │   └── service-worker.js
│   ├── popup/            # Main user interface
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/          # Settings configuration
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   └── utils/            # Shared utilities
│       └── rules.js      # Style enforcement
├── package.json          # Project dependencies
└── CLAUDE.md            # Development context
```

## Development

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Security & Privacy

- 🔒 API keys stored securely in Chrome's local storage
- 🚫 No data sent to external servers (except AI providers)
- 🛡️ Content scripts run in isolated environments
- 🔐 All API calls use HTTPS encryption

## Troubleshooting

### Common Issues

**Extension not extracting data:**
- Ensure you're on a supported site (LinkedIn profiles work best)
- Check that content scripts are properly loaded
- Verify site permissions in Chrome extensions

**AI generation failing:**
- Check your API key in Options
- Verify you have sufficient API credits
- Check browser console for error messages

**Generated emails don't follow rules:**
- Style rules are enforced both in prompts and post-processing
- Report consistent rule violations as bugs

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Roadmap

- [ ] Direct Gmail/Outlook injection
- [ ] Template library with analytics
- [ ] CRM integration (Notion, Airtable)
- [ ] Follow-up reminders
- [ ] Team collaboration features
- [ ] A/B testing for message effectiveness

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Search existing GitHub issues
- Create a new issue with detailed reproduction steps