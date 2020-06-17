const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ShellPlugin = require('webpack-shell-plugin-next');

module.exports = {
  entry: './gui-src/js/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve('dist/gui'),
    publicPath: 'http://localhost:19091/gui/ignite-composite-renderer-plugin/',
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    '@material-ui/core': 'MaterialUI',
    '@material-ui/icons': 'MaterialIcons',
    '@material-ui/core/styles': 'MaterialStyles',
    'ignite-gui': 'gui',
    'ignite-editor': 'editor',
  },
  module: {
    rules: [
      {
        test: /\.(m?js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          }
        },
      },
    ],
  },
  plugins: [
    new ShellPlugin({
      onBuildStart: {
        scripts: [
          'wasm-pack build --release --no-typescript --out-name index gui-src'
        ],
        blocking: true,
      },
    }),
    new ShellPlugin({
      onBuildStart: {
        scripts: [
          'wasm-pack build --release --no-typescript --out-name index --target nodejs'
        ],
        blocking: true,
      },
    }),
    new CopyPlugin([
      { from: 'manifest.json', to: '..' },
      { from: 'templates', to: '../templates' },
      { from: 'pkg/index.js', to: '..' },
      { from: 'pkg/index_bg.wasm', to: '..' },
    ]),
  ],
};
