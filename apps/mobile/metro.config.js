const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Web app uses React 19; mobile must stay on React 18. Pin every resolve.
const singleReactPackages = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react/index.js',
]);

config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
};

config.resolver.blockList = exclusionList([
  // Don't pull Next.js / web sources into the native bundle
  new RegExp(`${path.resolve(workspaceRoot, 'apps/web').replace(/[/\\]/g, '[/\\\\]')}[/\\\\].*`),
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    singleReactPackages.has(moduleName) ||
    (moduleName.startsWith('react/') && !moduleName.startsWith('react-native'))
  ) {
    return {
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
    return {
      filePath: require.resolve(moduleName, {
        paths: [workspaceRoot, projectRoot],
      }),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
