# One-Click Outreach Chrome Extension

A Chrome extension that streamlines CRM contact management and personalized outreach email generation directly from LinkedIn profiles and webpages using AI and Notion integration.

## 🎯 Primary Features

### **CRM Contact Management (Primary)**
- 🏢 **Auto-Extract Contact Data**: Automatically detects name, company, title, LinkedIn URL from profiles
- 🔍 **Smart Contact Lookup**: Finds existing contacts in Notion CRM by LinkedIn URL or email
- ➕ **One-Click Contact Creation**: Adds new contacts to your Notion CRM with all extracted data
- 📝 **Editable Contact Fields**: Review and edit all contact information before saving
- 🔗 **Notion Integration**: Full integration with Notion databases for contacts, projects, and outreach logs

### **AI Email Generation (Secondary)**
- 🤖 **AI-Powered Emails**: Uses Anthropic Claude or OpenAI GPT for intelligent email composition
- 📏 **Professional Formatting**: Enforces consistent style (max 6 sentences, 1-2 paragraphs)
- 🎯 **CRM-Aware Prompting**: Uses contact relationship data for more personalized emails
- 📧 **Custom Templates**: Create and manage email templates for different scenarios

## 🚀 Quick Start

### Installation for Team Members

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd one-click-outreach
   ```

2. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `src/` folder from this project

### Essential Setup

#### 1. Configure Notion CRM Integration
1. **Create Notion Integration**
   - Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Create a new integration and copy the API key

2. **Set up Notion Databases**
   Create these databases in your Notion workspace:

   **Contacts Database** (Required):
   ```
   Fields:
   - First Name (Text)
   - Last Name (Text) 
   - Email (Email)
   - Company (Text)
   - LinkedIn (URL)
   - Title (Text)
   - Phone (Phone)
   - Notes (Text)
   - Created (Date)
   - Last Modified (Last edited time)
   ```

   **Projects Database** (Optional):
   ```
   Fields:
   - Name (Title)
   - Description (Text)
   - Status (Select)
   - Created (Date)
   ```

   **Outreach Logs Database** (Optional):
   ```
   Fields:
   - Contact (Relation to Contacts)
   - Subject (Text)
   - Content (Text)
   - Method (Select: Email, LinkedIn, etc.)
   - Date (Date)
   - Status (Select: Sent, Draft, etc.)
   ```

3. **Configure Extension**
   - Click the extension icon → "Options"
   - Add your Notion API key
   - Add your database IDs (found in the database URLs)
   - Test the connection

#### 2. Configure AI Provider (Optional)
- Add your Anthropic Claude or OpenAI API key in Options
- Set up calendar link and bio for email generation

### Daily Usage Workflow

1. **Visit LinkedIn Profile or Website**
2. **Click Extension Icon** - Contact data is auto-extracted and displayed
3. **Review Contact Information** - Edit any fields as needed
4. **Click "Check CRM"** - Searches your Notion CRM for existing contact
5. **Take Action Based on Results:**
   - **Contact Found**: View existing contact info and associated projects
   - **Contact Not Found**: Click "Create in CRM" to add them
6. **Optional: Generate Outreach Email**
   - Click "Generate Outreach Email" to expand email tools
   - Choose template and write intent
   - Generate AI-powered email with CRM context

## 🗃️ CRM Contact Matching Logic

The extension finds contacts using high-confidence identifiers:

- ✅ **Exact LinkedIn URL match** - Most reliable identifier
- ✅ **Exact email address match** - High confidence match
- ❌ **Name-only matching** - Avoided to prevent false positives

## 🎨 File Structure

```
src/
├── manifest.json           # Extension configuration
├── content/               # Page data extraction
│   ├── linkedin.js        # LinkedIn profile extractor
│   └── generic.js         # Generic webpage extractor
├── background/            # CRM & AI processing
│   └── service-worker.js  # Notion API, AI calls
├── popup/                # Main user interface
│   ├── popup.html         # CRM form, email generation
│   ├── popup.js          # CRM logic, UI controls
│   └── popup.css         # Styling
├── options/              # Settings configuration
│   ├── options.html      # Notion setup, AI config
│   ├── options.js       # Settings management
│   └── options.css      # Settings styling
└── utils/               # Shared utilities
    └── rules.js         # Email style enforcement
```

## 🔧 Development & Testing

### Validation
```bash
node test/validate-extension.js
```

### Development Mode
- The extension includes detailed console logging for debugging
- Check browser console (F12) for extraction and CRM operation details
- Test CRM connections in Options page

## 🔐 Security & Privacy

- 🔒 **Local Storage**: All API keys stored securely in Chrome's sync storage
- 🚫 **No External Tracking**: No data sent to servers except Notion & AI providers
- 🛡️ **Isolated Execution**: Content scripts run in secure environments
- 🔐 **HTTPS Only**: All API calls use encrypted connections

## 📋 Team Guidelines

### For Sales/Business Development Teams

1. **Daily Workflow**: Use CRM features first, email generation as needed
2. **Data Quality**: Always review auto-extracted data before saving to CRM
3. **Contact Hygiene**: Use the search function to avoid duplicate contacts
4. **Project Tracking**: Link contacts to relevant projects in Notion

### For Technical Team Members

1. **Database Setup**: Ensure all team members have access to shared Notion databases
2. **Field Mapping**: Contact database fields must match exactly as specified
3. **API Management**: Monitor API usage for Notion and AI providers
4. **Debugging**: Use browser console to troubleshoot extraction issues

## 🆘 Troubleshooting

### CRM Issues
- **"Contact not found" when it should exist**: Check LinkedIn URL exactly matches
- **Contact creation fails**: Verify Notion API key and database permissions
- **Fields not auto-populating**: Check browser console for extraction errors

### LinkedIn Extraction Issues
- **Company/title not detected**: Extension tries multiple selectors; some profiles may need manual entry
- **No data extracted**: Refresh page and reopen extension
- **LinkedIn layout changed**: Extension uses multiple selectors but may need updates

### Email Generation Issues
- **Generation fails**: Check AI provider API key and credits
- **Style rules not followed**: Rules are enforced in prompts and post-processing

## 🚀 Roadmap

### Current Capabilities
- ✅ Full Notion CRM integration
- ✅ LinkedIn profile extraction
- ✅ Contact management workflow
- ✅ AI email generation with CRM context

### Planned Enhancements
- [ ] Bulk contact import from LinkedIn lists
- [ ] Advanced project-contact relationship management
- [ ] Email tracking and analytics
- [ ] Team collaboration features
- [ ] Automated follow-up reminders
- [ ] Direct Gmail/Outlook integration

## 📞 Support

For team support:
1. Check this README and troubleshooting section
2. Verify Notion database setup matches specifications
3. Test with browser console open for debugging info
4. Create GitHub issues for bugs or feature requests

## 📄 License

MIT License - See LICENSE file for details.