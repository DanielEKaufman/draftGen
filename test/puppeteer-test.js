const puppeteer = require('puppeteer');
const path = require('path');

class ChromeExtensionTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.extensionId = null;
  }

  async setup() {
    console.log('🚀 Setting up Chrome with extension...');
    
    const extensionPath = path.resolve(__dirname, '../src');
    
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // Get extension ID
    const targets = await this.browser.targets();
    const extensionTarget = targets.find(
      target => target.type() === 'service_worker' && target.url().includes('chrome-extension://')
    );
    
    if (extensionTarget) {
      this.extensionId = extensionTarget.url().split('/')[2];
      console.log(`✅ Extension loaded with ID: ${this.extensionId}`);
    } else {
      throw new Error('Extension not found');
    }

    this.page = await this.browser.newPage();
  }

  async testLinkedInExtraction() {
    console.log('🔍 Testing LinkedIn extraction...');
    
    // Navigate to a LinkedIn profile (you'll need to be logged in)
    await this.page.goto('https://www.linkedin.com/in/satyanadella/', { 
      waitUntil: 'networkidle2' 
    });
    
    await this.page.waitForTimeout(2000);

    // Open extension popup
    const popupUrl = `chrome-extension://${this.extensionId}/popup/popup.html`;
    const popupPage = await this.browser.newPage();
    await popupPage.goto(popupUrl);

    // Wait for content extraction
    await popupPage.waitForTimeout(3000);

    // Check if content was extracted
    const extractedContent = await popupPage.$eval('#contentPreview', el => el.textContent);
    const sourceType = await popupPage.$eval('#sourceType', el => el.textContent);

    console.log('📄 Extracted content preview:', extractedContent.substring(0, 100) + '...');
    console.log('🏷️ Source type:', sourceType);

    return {
      hasContent: extractedContent.length > 20,
      isLinkedIn: sourceType === 'LinkedIn',
      contentPreview: extractedContent
    };
  }

  async testGenericWebsiteExtraction() {
    console.log('🌐 Testing generic website extraction...');
    
    // Test on a news article or blog post
    await this.page.goto('https://blog.anthropic.com/claude-3-5-sonnet/', { 
      waitUntil: 'networkidle2' 
    });
    
    await this.page.waitForTimeout(2000);

    // Open extension popup
    const popupUrl = `chrome-extension://${this.extensionId}/popup/popup.html`;
    const popupPage = await this.browser.newPage();
    await popupPage.goto(popupUrl);

    // Wait for content extraction
    await popupPage.waitForTimeout(3000);

    // Check if content was extracted
    const extractedContent = await popupPage.$eval('#contentPreview', el => el.textContent);
    const sourceType = await popupPage.$eval('#sourceType', el => el.textContent);

    console.log('📄 Extracted content preview:', extractedContent.substring(0, 100) + '...');
    console.log('🏷️ Source type:', sourceType);

    return {
      hasContent: extractedContent.length > 20,
      isGeneric: sourceType === 'Webpage',
      contentPreview: extractedContent
    };
  }

  async testEmailGeneration() {
    console.log('✉️ Testing email generation...');
    
    // Navigate to a test page
    await this.page.goto('https://anthropic.com/about', { 
      waitUntil: 'networkidle2' 
    });
    
    // Open extension popup
    const popupUrl = `chrome-extension://${this.extensionId}/popup/popup.html`;
    const popupPage = await this.browser.newPage();
    await popupPage.goto(popupUrl);

    // Wait for content extraction
    await popupPage.waitForTimeout(3000);

    // Fill in message intent
    await popupPage.type('#messageIntent', 'Introductory note, ask for 15-minute call');

    // Note: This would require API key setup
    console.log('📝 Message intent entered. Email generation requires API key configuration.');

    return { intentEntered: true };
  }

  async testPopupDimensions() {
    console.log('📏 Testing popup dimensions...');
    
    const popupUrl = `chrome-extension://${this.extensionId}/popup/popup.html`;
    const popupPage = await this.browser.newPage();
    await popupPage.goto(popupUrl);

    const dimensions = await popupPage.evaluate(() => ({
      width: document.body.offsetWidth,
      height: document.body.offsetHeight
    }));

    console.log(`📐 Popup dimensions: ${dimensions.width}x${dimensions.height}px`);

    return {
      width: dimensions.width,
      height: dimensions.height,
      isWideEnough: dimensions.width >= 400
    };
  }

  async runAllTests() {
    try {
      await this.setup();

      const results = {
        popupDimensions: await this.testPopupDimensions(),
        genericExtraction: await this.testGenericWebsiteExtraction(),
        emailGeneration: await this.testEmailGeneration()
      };

      console.log('\n📊 Test Results Summary:');
      console.log('========================');
      console.log(`✅ Popup width adequate: ${results.popupDimensions.isWideEnough}`);
      console.log(`✅ Generic extraction working: ${results.genericExtraction.hasContent}`);
      console.log(`✅ Email generation UI ready: ${results.emailGeneration.intentEntered}`);

      return results;
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

// Run tests
async function main() {
  const tester = new ChromeExtensionTester();
  
  try {
    const results = await tester.runAllTests();
    console.log('\n🎉 All tests completed!');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('💥 Tests failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = ChromeExtensionTester;