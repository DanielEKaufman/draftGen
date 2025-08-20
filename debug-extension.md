# Chrome Extension Debug Guide

## Current Error: "An unknown error occurred when fetching the script"

This usually indicates one of these issues:

### 1. Service Worker Script Loading Issues

**Check Chrome DevTools:**
1. Open Chrome → `chrome://extensions/`
2. Click "Inspect views: service worker" on your extension
3. Check Console for specific error messages

**Common causes:**
- Incorrect file paths in manifest.json
- Syntax errors in service-worker.js  
- ImportScripts failing to load utils/rules.js

### 2. File Path Issues

**Current structure:**
```
src/
├── background/service-worker.js  (tries to import utils/rules.js)
├── utils/rules.js                (should be accessible)
└── manifest.json                 (points to background/service-worker.js)
```

**Path resolution:** importScripts('utils/rules.js') should resolve from extension root

### 3. Debugging Steps

**Step 1: Simplify service worker**
Temporarily comment out the importScripts line to see if base functionality works.

**Step 2: Check file permissions**  
Ensure all files are readable and properly formatted.

**Step 3: Check for syntax errors**
Run: `npm test` to validate all files.

### 4. Quick Fix Options

**Option A: Inline the StyleRules**
Copy StyleRules class directly into service-worker.js

**Option B: Remove StyleRules dependency**
Make style enforcement work without the utility class

**Option C: Fix import path**
Ensure utils/rules.js is properly accessible

### 5. Test Command
```bash
npm test  # Should show all files present and valid
```

### 6. Chrome Extension Debugging
1. Load extension in developer mode
2. Check "Inspect views: service worker" 
3. Look at Console tab for specific errors
4. Check Network tab for failed resource loads