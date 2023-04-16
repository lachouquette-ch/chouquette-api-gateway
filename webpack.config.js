/*
 * Copyright (c) 2023 by Fabrice Douchant <fabrice.douchant@gmail.com>.
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
