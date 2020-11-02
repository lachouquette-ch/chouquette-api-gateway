const path = require('path')

const cleanWebpackPlugin = require("clean-webpack-plugin");
const nodeExternals = require("webpack-node-externals");

module.exports = {
    entry: [path.join(__dirname, "/index.js")],
    externals: [nodeExternals({})],
    module: {
        rules: [
            { test: /\.graphql|\.gql$/, loader: 'webpack-graphql-loader' }
        ]
    },
    output: {
        filename: "server.js",
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.js']
    },
    target: 'node',
    plugins: [new cleanWebpackPlugin.CleanWebpackPlugin()]
};