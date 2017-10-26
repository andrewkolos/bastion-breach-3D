const path = require('path');

module.exports = {
    entry: './src/index.ts',
    devtool: "inline-source-map",
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