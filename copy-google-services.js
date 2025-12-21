#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'google-services.json');
const dest = path.join(__dirname, 'android', 'app', 'google-services.json');

if (fs.existsSync(source)) {
  fs.copyFileSync(source, dest);
  console.log('✓ google-services.json copied to android/app/');
} else {
  console.warn('⚠ google-services.json not found in project root');
}
