const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure all files are included in the bundle
config.resolver.assetExts.push('json');

// Add support for the .* pattern (to exclude .DS_Store, etc.)
config.resolver.blacklistRE = /node_modules\/.*\/(\.git|\.cache|dist)\//;

module.exports = config;

