const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    devtool: "inline-source-map",
    plugins: [
        new UglifyJSPlugin()
    ],
    module: {
        loaders: [
            { test: /\.ts$/, loader: 'ts-loader' }
        ]
    },
    resolve: {
        extensions: [ ".tsx", ".ts", ".js" ],
        alias: {
            'three': path.resolve(path.join(__dirname, 'node_modules', 'three'))
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },

    devServer: {
        contentBase: __dirname + "/dist"
    }
};