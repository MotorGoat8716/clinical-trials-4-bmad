// Create this file: frontend/config-overrides.js
// This fixes Node.js modules not available in browser

const path = require('path');

module.exports = function override(config, env) {
  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "url": require.resolve("url/"),
    "querystring": require.resolve("querystring-es3"),
    "buffer": require.resolve("buffer"),
    "util": require.resolve("util"),
    "stream": require.resolve("stream-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "path": require.resolve("path-browserify"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
  };

  // Add plugins for polyfills
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  );

  return config;
};