# Manual Testing Guide

## Quick Test Checklist

### 1. Extension Loading
- [ ] Extension loads without errors in chrome://extensions/
- [ ] No red error messages in developer mode
- [ ] Extension icon appears in toolbar

### 2. Popup Functionality
- [ ] Popup opens when clicking extension icon
- [ ] Popup is wide enough (400px) to see all content
- [ ] Loading spinner appears initially
- [ ] No JavaScript errors in browser console (F12)

### 3. Content Extraction Testing

#### Test Sites:
1. **LinkedIn Profile** (if logged in)
   - Visit: https://www.linkedin.com/in/satyanadella/
   - Expected: "LinkedIn" badge, profile info extracted

2. **News Article**
   - Visit: https://blog.anthropic.com/claude-3-5-sonnet/
   - Expected: "Webpage" badge, article content extracted

3. **Company About Page**
   - Visit: https://anthropic.com/about
   - Expected: "Webpage" badge, company info extracted

4. **GitHub Profile**
   - Visit: https://github.com/torvalds
   - Expected: "Webpage" badge, profile content extracted

### 4. Error Scenarios
- [ ] Visit chrome://extensions/ (should show error message)
- [ ] Visit blank page (should show "no content" message)
- [ ] Test retry button functionality

### 5. Options Page
- [ ] Click settings gear icon opens options page
- [ ] Form fields are properly styled
- [ ] API provider selection works
- [ ] Save button shows feedback

## Console Debugging

Open browser console (F12) and look for:
- ✅ "LinkedIn content script loaded"
- ✅ "Generic content script loaded" 
- ✅ "One-Click Outreach background service initialized"
- ❌ Any red error messages

## Common Issues & Fixes

### "No content could be extracted"
1. Check console for script loading errors
2. Verify you're on a page with meaningful content
3. Try refreshing the page and reopening popup

### Popup too narrow
1. Check if CSS changes applied (400px width)
2. Try different screen resolutions
3. Check for CSS conflicts

### Script errors
1. Reload extension in chrome://extensions/
2. Check for any file permission issues
3. Verify manifest.json syntax

## Performance Testing

Time these operations:
- [ ] Popup open time: < 2 seconds
- [ ] Content extraction: < 3 seconds
- [ ] UI responsiveness: smooth animations

## Browser Compatibility

Test on:
- [ ] Chrome 120+ (recommended)
- [ ] Chrome 115+ (minimum)
- [ ] Different screen sizes (desktop/laptop)