const path = require('path')

const cleanWebpackPlugin = require("clean-webpack-plugin");
const webpackNodeExternals = require("webpack-node-externals");

module.exports = {
    target: 'node',
    entry: ['@babel/polyfill', './index.js'],
    watchOptions: {
        ignored: /node_modules/
    },
    externals: [webpackNodeExternals()],
    output: {
        filename: "server.js",
        path: path.resolve(__dirname, 'dist')
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /.js$/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
                "eslint-loader"]
            },
        ]
    },
    plugins: [new cleanWebpackPlugin.CleanWebpackPlugin()]
};
