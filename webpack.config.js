const path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './src/index.ts',
    devtool: "inline-source-map",
    module: {
        loaders: [
            { test: /\.ts$/, loader: 'ts-loader' }
        ]
    },
    resolve: {
        extensions: [ ".tsx", ".ts", ".js" ]
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};