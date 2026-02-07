const path = require('path');

/**
 * Webpack config for Language Server
 * Bundles server.js and dependencies into vscode-extension/dist/server.js
 * Output location ensures server bundle is included in .vsix
 */
module.exports = {
  target: 'node',
  context: path.resolve(__dirname),  // Set base directory to language-server/
  entry: './out/server.js',  // Compiled TypeScript output (relative to context)
  output: {
    path: path.resolve(__dirname, '../vscode-extension/dist'),  // Output to client's dist/
    filename: 'server.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.js']
  },
  mode: 'production',
  devtool: 'source-map',
  node: {
    __dirname: false  // Preserve __dirname for runtime path resolution
  }
};
