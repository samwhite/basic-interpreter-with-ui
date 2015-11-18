var webpack = require("webpack");
var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: path.join(__dirname, "src", "javascripts") + "/entry.js",
  output: {
    path: path.join(__dirname, "dist/assets"),
    filename: "bundle.js"
  },
  resolve: {
    extensions: ["", ".js", ".jsx", ".js.jsx", ".css", ".scss", ".css.scss"]
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: path.join(__dirname, "src/javascripts"),
        exclude: /(node_modules)/,
        loader: "babel",
        query: {
          presets: ["react", "es2015", "stage-0"]
        }
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("css-loader")
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader")
      },
      {
        test: require.resolve("react"),
        loader: "expose?React"
      },
      {
        test: require.resolve("react-dom"),
        loader: "expose?ReactDOM"
      }
    ]
  },
  plugins: [
      new ExtractTextPlugin("bundle.css", { allChunks: true })
  ],
  stats: {
    children: false
  }
};
