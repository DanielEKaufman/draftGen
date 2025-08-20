# Testing Framework for One-Click Outreach Extension

## Overview
This testing framework provides both automated validation and manual testing guidance for the Chrome extension.

## Quick Start

### 1. Validation Test (Automated)
```bash
npm test
# or directly:
node test/validate-extension.js
```

This checks:
- ✅ All required files exist
- ✅ Manifest.json is valid
- ✅ JavaScript syntax is correct
- ✅ CSS files are properly structured
- ✅ Permissions are correctly configured

### 2. Manual Testing
```bash
npm run test:manual
# Then follow: test/manual-test-guide.md
```

### 3. Automated Browser Testing (Optional)
```bash
npm run test:puppeteer
```

## Test Categories

### 🔧 Structure Validation
- File existence and organization
- Manifest.json compliance with Chrome Extension API
- JavaScript syntax validation
- CSS structure verification

### 🌐 Content Extraction Testing
- LinkedIn profile data extraction
- Generic webpage content extraction
- Error handling for unsupported pages
- Content script injection verification

### 🖥️ UI/UX Testing
- Popup dimensions and layout
- Options page functionality
- Loading states and animations
- Error message display

### ⚡ Performance Testing
- Extension load time
- Content extraction speed
- Memory usage monitoring
- Background script efficiency

## Automated Testing Tools

### Extension Validator (`validate-extension.js`)
Comprehensive static analysis of extension files:
```javascript
const validator = new ExtensionValidator();
const isValid = validator.validate();
```

### Puppeteer Test Suite (`puppeteer-test.js`)
Browser automation for functional testing:
```javascript
const tester = new ChromeExtensionTester();
await tester.runAllTests();
```

## Manual Testing Scenarios

### Critical Path Testing
1. **Happy Path**: LinkedIn → Extract → Generate → Copy
2. **Generic Path**: Blog post → Extract → Generate → Copy  
3. **Error Path**: Invalid page → Show error → Retry

### Edge Cases
- Very long profile descriptions
- Pages with minimal content
- Sites with complex JavaScript loading
- Different LinkedIn profile layouts
- Mobile vs desktop layouts

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Validate Extension
  run: npm test
  
- name: Lint Code
  run: npm run lint
```

## Performance Benchmarks

Target metrics:
- Popup load: < 2 seconds
- Content extraction: < 3 seconds
- Email generation: < 10 seconds
- Memory usage: < 50MB

## Browser Compatibility

Tested configurations:
- Chrome 120+ (primary)
- Chrome 115+ (minimum supported)
- Various screen resolutions
- Different system themes

## Debugging Guide

### Common Issues
1. **Content not extracted**
   - Check console for script errors
   - Verify content scripts are loading
   - Test on different page types

2. **Popup not opening**
   - Check manifest permissions
   - Verify popup.html path
   - Look for JavaScript errors

3. **API calls failing**
   - Validate API keys in options
   - Check network connectivity
   - Monitor background script logs

### Debug Commands
```bash
# Check file structure
npm test

# Lint for code issues  
npm run lint

# Format code consistently
npm run format

# Full validation pipeline
npm run validate
```

## Testing Philosophy

Following principles similar to Context7 framework testing:
- **Component isolation**: Test individual parts separately
- **Integration testing**: Verify components work together
- **Real-world scenarios**: Test with actual websites
- **Performance monitoring**: Track metrics over time
- **Cross-browser compatibility**: Support multiple environments

## Future Enhancements

- [ ] Jest unit tests for utility functions
- [ ] Selenium WebDriver integration
- [ ] Visual regression testing
- [ ] API mocking for consistent tests
- [ ] Performance profiling tools
- [ ] Accessibility testing (a11y)

## Contributing to Tests

When adding new features:
1. Add file validation to `validate-extension.js`
2. Create manual test scenarios in `manual-test-guide.md`
3. Consider Puppeteer automation for complex workflows
4. Update performance benchmarks if needed

## Resources

- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/tut_debugging/)
- [Puppeteer Chrome Extension Testing](https://github.com/GoogleChrome/puppeteer/blob/main/docs/api.md#working-with-chrome-extensions)
- [Context7 Testing Patterns](https://framework7.io/docs/testing) (if applicable)