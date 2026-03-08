const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

// Only look in mobile's node_modules first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force react/react-native to always resolve from mobile's node_modules.
// This prevents duplicate React instances when packages from root
// node_modules try to import react.
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');

config.resolver.extraNodeModules = {
  react: path.resolve(mobileNodeModules, 'react'),
  'react-native': path.resolve(mobileNodeModules, 'react-native'),
};

// Block root's react from being resolved by disabling hierarchical lookup
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
