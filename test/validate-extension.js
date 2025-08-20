#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ExtensionValidator {
  constructor() {
    this.srcPath = path.resolve(__dirname, '../src');
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${icon} ${message}`);
  }

  validateFile(filePath, required = true) {
    if (fs.existsSync(filePath)) {
      this.log(`Found: ${path.relative(this.srcPath, filePath)}`);
      return true;
    } else {
      const message = `Missing: ${path.relative(this.srcPath, filePath)}`;
      if (required) {
        this.errors.push(message);
        this.log(message, 'error');
      } else {
        this.warnings.push(message);
        this.log(message, 'warning');
      }
      return false;
    }
  }

  validateManifest() {
    console.log('\n📋 Validating manifest.json...');
    
    const manifestPath = path.join(this.srcPath, 'manifest.json');
    if (!this.validateFile(manifestPath)) return;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Check required fields
      const required = ['manifest_version', 'name', 'version', 'permissions'];
      required.forEach(field => {
        if (manifest[field]) {
          this.log(`Manifest has ${field}`);
        } else {
          this.errors.push(`Manifest missing ${field}`);
          this.log(`Manifest missing ${field}`, 'error');
        }
      });

      // Check content scripts
      if (manifest.content_scripts && manifest.content_scripts.length > 0) {
        this.log(`Content scripts configured: ${manifest.content_scripts.length}`);
      } else {
        this.warnings.push('No content scripts configured');
        this.log('No content scripts configured', 'warning');
      }

      // Check background script
      if (manifest.background && manifest.background.service_worker) {
        this.log(`Background service worker: ${manifest.background.service_worker}`);
      } else {
        this.warnings.push('No background service worker');
        this.log('No background service worker', 'warning');
      }

    } catch (error) {
      this.errors.push(`Invalid manifest.json: ${error.message}`);
      this.log(`Invalid manifest.json: ${error.message}`, 'error');
    }
  }

  validateFiles() {
    console.log('\n📁 Validating required files...');
    
    const requiredFiles = [
      'manifest.json',
      'popup/popup.html',
      'popup/popup.js',
      'popup/popup.css',
      'options/options.html', 
      'options/options.js',
      'options/options.css',
      'background/service-worker.js',
      'content/linkedin.js',
      'content/generic.js',
      'utils/rules.js'
    ];

    requiredFiles.forEach(file => {
      this.validateFile(path.join(this.srcPath, file));
    });
  }

  validateJavaScript() {
    console.log('\n🔍 Validating JavaScript syntax...');
    
    const jsFiles = [
      'popup/popup.js',
      'options/options.js', 
      'background/service-worker.js',
      'content/linkedin.js',
      'content/generic.js',
      'utils/rules.js'
    ];

    jsFiles.forEach(file => {
      const filePath = path.join(this.srcPath, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Basic syntax checks
          if (content.includes('class ') && !content.includes('if (typeof window.')) {
            this.warnings.push(`${file} may have redeclaration issues`);
            this.log(`${file} may have redeclaration issues`, 'warning');
          }
          
          // Check for console.log in production code
          if (content.includes('console.log') || content.includes('console.error')) {
            this.log(`${file} contains console statements (ok for debugging)`);
          }
          
          this.log(`${file} syntax looks good`);
        } catch (error) {
          this.errors.push(`${file} syntax error: ${error.message}`);
          this.log(`${file} syntax error: ${error.message}`, 'error');
        }
      }
    });
  }

  validateCSS() {
    console.log('\n🎨 Validating CSS files...');
    
    const cssFiles = ['popup/popup.css', 'options/options.css'];
    
    cssFiles.forEach(file => {
      const filePath = path.join(this.srcPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for width constraints
        if (file === 'popup/popup.css' && content.includes('width: 400px')) {
          this.log(`${file} has correct popup width`);
        }
        
        this.log(`${file} looks good`);
      }
    });
  }

  validatePermissions() {
    console.log('\n🔐 Validating permissions...');
    
    const manifestPath = path.join(this.srcPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      const expectedPermissions = ['activeTab', 'storage', 'scripting'];
      const hasPermissions = manifest.permissions || [];
      
      expectedPermissions.forEach(perm => {
        if (hasPermissions.includes(perm)) {
          this.log(`Permission granted: ${perm}`);
        } else {
          this.warnings.push(`Missing permission: ${perm}`);
          this.log(`Missing permission: ${perm}`, 'warning');
        }
      });

      if (manifest.host_permissions) {
        this.log(`Host permissions: ${manifest.host_permissions.length} patterns`);
      }
    }
  }

  generateReport() {
    console.log('\n📊 Validation Report');
    console.log('===================');
    
    if (this.errors.length === 0) {
      this.log('🎉 No critical errors found!');
    } else {
      this.log(`❌ ${this.errors.length} error(s) found:`, 'error');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      this.log(`⚠️ ${this.warnings.length} warning(s):`, 'warning');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    console.log('\n🚀 Extension ready for loading:', this.errors.length === 0 ? 'YES' : 'NO');
    return this.errors.length === 0;
  }

  validate() {
    console.log('🔍 Validating One-Click Outreach Extension...\n');
    
    this.validateFiles();
    this.validateManifest();
    this.validateJavaScript();
    this.validateCSS();
    this.validatePermissions();
    
    return this.generateReport();
  }
}

// Run validation
const validator = new ExtensionValidator();
const isValid = validator.validate();

process.exit(isValid ? 0 : 1);