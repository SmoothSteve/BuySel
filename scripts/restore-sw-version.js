#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

// Read the service worker file
const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Restore the version placeholder
// This regex will match any version string that was inserted
swContent = swContent.replace(/const SW_VERSION = '[^']+';/, "const SW_VERSION = '__SW_VERSION__';");

// Write back to the file
fs.writeFileSync(swPath, swContent);

console.log(`✅ Service Worker version placeholder restored`);
console.log(`   File: ${swPath}`);
