# One-Click Outreach - Deployment Guide

## Development Setup

### Prerequisites
- Node.js 16+ 
- Chrome browser
- Git

### Initial Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd one-click-outreach
   npm install
   ```

2. **Load extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `src/` folder from this project

3. **Configure the extension:**
   - Click the extension icon in Chrome toolbar
   - Click "Settings" (gear icon)
   - Add your Anthropic Claude or OpenAI API key
   - Configure your calendar link and bio (optional)
   - Save settings

## Testing

### Manual Testing

1. **Test LinkedIn extraction:**
   - Visit any LinkedIn profile
   - Click the extension icon
   - Verify profile data is extracted correctly
   - Enter a message intent: "Introductory note, ask for 15-minute call"
   - Click "Generate Email"
   - Verify the email follows style rules (max 6 sentences, 1-2 paragraphs, no em dashes)

2. **Test generic webpage extraction:**
   - Visit a webpage with meaningful content (blog post, company about page)
   - Click the extension icon
   - Verify content is extracted
   - Generate an email and test

3. **Test API connections:**
   - Go to Options page
   - Use "Test API Connection" button
   - Verify both Anthropic and OpenAI work (if you have keys for both)

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check code formatting
npm run check:format

# Format code
npm run format

# Run all validations
npm run validate
```

## Production Deployment

### Chrome Web Store Preparation

1. **Create icon files:**
   ```bash
   # Create 16x16, 48x48, and 128x128 PNG icons
   # Place them in the icons/ directory
   ```

2. **Update manifest.json:**
   - Verify all permissions are minimal and necessary
   - Update version number
   - Add proper description and author info

3. **Create deployment package:**
   ```bash
   npm run release
   # This validates code and confirms it's ready
   ```

4. **Package for Chrome Web Store:**
   ```bash
   # Create a ZIP file of the src/ directory
   zip -r one-click-outreach-v1.0.0.zip src/ -x "*.DS_Store"
   ```

### Chrome Web Store Submission

1. **Developer Account:**
   - Register at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Pay one-time $5 registration fee

2. **Submit Extension:**
   - Upload the ZIP file
   - Fill out store listing:
     - Title: "One-Click Outreach"
     - Description: Use content from README.md
     - Category: "Productivity"
     - Screenshots: Create 4-5 screenshots showing the extension in action
   - Set privacy practices
   - Submit for review

3. **Review Process:**
   - Typically takes 1-3 days
   - Address any feedback from Google review team
   - Once approved, extension goes live

## Environment Configuration

### API Keys Security
- Never commit API keys to repository
- Keys are stored in Chrome's secure storage
- Users enter their own API keys
- No server-side storage of credentials

### Permissions
Current permissions requested:
- `activeTab`: Access current tab content for extraction
- `storage`: Store user preferences and API keys
- `scripting`: Inject content scripts for data extraction

### Host Permissions
- `*://www.linkedin.com/*`: LinkedIn-specific extraction
- `*://*/*`: Generic webpage extraction

## Monitoring and Updates

### Version Updates
1. Update version in `manifest.json`
2. Update version in `package.json`
3. Create release notes
4. Test thoroughly
5. Package and submit to Chrome Web Store

### User Support
- GitHub Issues for bug reports
- Extension reviews in Chrome Web Store
- Monitor console errors in browser developer tools

### Analytics (Optional)
Consider adding privacy-friendly analytics:
- Count of emails generated (no content stored)
- API provider usage distribution
- Error rates and types

## Security Considerations

### Content Security Policy
- No inline scripts or styles
- All external API calls use HTTPS
- Sanitize all user inputs

### Data Privacy
- No user data stored on external servers
- API calls go directly to AI providers
- Local Chrome storage only for settings

### API Key Protection
- Never log or expose API keys
- Use secure Chrome storage APIs
- Prompt users to use restricted API keys when possible

## Troubleshooting

### Common Issues

1. **Extension not loading:**
   - Check Chrome version compatibility
   - Verify manifest.json syntax
   - Check browser console for errors

2. **Data extraction failing:**
   - LinkedIn frequently changes their DOM structure
   - May need to update selectors in `linkedin.js`
   - Test on different LinkedIn profile types

3. **API calls failing:**
   - Verify API key validity
   - Check API rate limits
   - Ensure proper API endpoint URLs

4. **Style rules not enforcing:**
   - Check `StyleRules` class import in service worker
   - Verify rule enforcement in prompt and post-processing

### Debug Mode
Enable debug mode in Options to get verbose logging:
- Check browser console (F12)
- Look for background service worker logs
- Monitor network tab for API calls