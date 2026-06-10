const path = require('path');

/**
 * Webpack config for VSCode extension (client)
 * Bundles extension.js and dependencies into dist/extension.js
 */
module.exports = {
  target: 'node',
  context: path.resolve(__dirname),  // Set base directory to vscode-extension/
  entry: './out/extension.js',  // Compiled TypeScript output (relative to context)
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'  // Exclude vscode module from bundle
  },
  resolve: {
    extensions: ['.js']
  },
  mode: 'production',
  devtool: 'source-map'
};
