const path = require('path');

/**
 * Webpack config for Language Server
 * Bundles server.js and all runtime dependencies into a single self-contained file.
 * Output goes to language-server/dist/ (neutral location) — VSCode, JetBrains,
 * Visual Studio 모두 이 번들 하나를 가져다 쓴다 (node_modules 동봉 불필요).
 */
module.exports = {
  target: 'node',
  context: path.resolve(__dirname),  // Set base directory to language-server/
  entry: './out/server.js',  // Compiled TypeScript output (relative to context)
  output: {
    path: path.resolve(__dirname, 'dist'),
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
