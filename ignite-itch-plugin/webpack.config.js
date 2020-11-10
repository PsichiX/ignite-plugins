const CopyPlugin = require('copy-webpack-plugin');
const ShellPlugin = require('webpack-shell-plugin-next');

module.exports = {
  entry: './gui-src/index.js',
  output: {
    filename: 'gui/index.js'
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
        test: /\.svg$/,
        exclude: /(node_modules|bower_components)/,
        use: ['@svgr/webpack'],
      },
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
          'wasm-pack build --release --no-typescript --out-name index --target nodejs'
        ],
        blocking: true,
      },
    }),
    new CopyPlugin({
      patterns: [
        'manifest.json',
        'pkg/index.js',
        'pkg/index_bg.wasm',
      ],
    }),
  ],
};
