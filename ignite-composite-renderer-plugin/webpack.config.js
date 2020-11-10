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
    '@material-ui/lab': 'MaterialLabUI',
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
          'wasm-pack build --release --no-typescript --out-name index gui-src',
          'D:\\Applications\\binaryen\\bin\\wasm2js gui-src/pkg/index_bg.wasm -o gui-src/pkg/index.asm.js --enable-mutable-globals',
          'chrobry.exe -e gui-src/index.asm.js.chrobry -f ASMJS=gui-src/pkg/index.asm.js -o gui-src/pkg/index.asm.js',
          'chrobry.exe -e gui-src/index_bg.js.chrobry -f JS=gui-src/pkg/index_bg.js -o gui-src/pkg/index_bg.js',
          "rm -f gui-src/pkg/index_bg.wasm",
          "rm -f gui-src/pkg/index.js",
          'wasm-pack build --release --no-typescript --out-name index --target nodejs',
        ],
        blocking: true,
      },
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '..' },
        { from: 'pkg/index.js', to: '..' },
        { from: 'pkg/index_bg.wasm', to: '..' },
      ],
    }),
  ],
};
