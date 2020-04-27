const CopyPlugin = require('copy-webpack-plugin');

const logic = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    libraryTarget: 'commonjs2',
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
    new CopyPlugin([
      'manifest.json',
      { from: 'templates', to: 'templates' },
    ]),
  ],
};

const gui = {
  entry: './gui-src/index.js',
  output: {
    filename: 'gui/index.js',
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
};

module.exports = [logic, gui];
