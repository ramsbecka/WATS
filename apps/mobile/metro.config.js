const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve Node built-in "punycode" to the npm package (required by whatwg-url-without-unicode in RN/Expo)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  punycode: path.resolve(__dirname, 'node_modules/punycode'),
};

module.exports = config;
