#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate version based on git commit hash and timestamp
let version = Date.now().toString();

try {
  const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  version = `${gitHash}-${Date.now()}`;
  console.log(`✅ Generated SW version from git: ${version}`);
} catch (error) {
  console.log('⚠️  Could not get git commit hash, using timestamp only:', version);
}

// Read the service worker file
const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace the version placeholder
swContent = swContent.replace(/__SW_VERSION__/g, version);

// Write back to the file
fs.writeFileSync(swPath, swContent);

console.log(`✅ Service Worker version updated to: ${version}`);
console.log(`   File: ${swPath}`);
