const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignorar diretórios problemáticos no node_modules
config.resolver.blockList = [
  /node_modules\/expo-modules-autolinking\/android\//,
  /node_modules\/expo-modules-core\/expo-module-gradle-plugin\//,
];

module.exports = config;
