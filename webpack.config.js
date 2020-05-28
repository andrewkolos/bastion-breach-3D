const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
    ],
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: [ ".tsx", ".ts", ".js" ],
        // alias: {
        //     'three': path.resolve(path.join(__dirname, 'node_modules', 'three'))
        // }
    },
    devServer: {
        contentBase: "./dist"
    }
};