const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ChunkManifestPlugin = require("chunk-manifest-webpack-plugin");
var merge = require("webpack-merge");

const config = merge([{
    entry: {
        app: "./src/js/index.js",
        client: "./src/js/client.js",
    },
    output: {
        filename: "[name].[hash:4].js",
        path: path.resolve(__dirname, "dist"),
    },
    resolve: {
        alias: {},
    },
    plugins: [
        new webpack.DefinePlugin({
            SOCKET_PORT: process.env.SOCKET_PORT || 3000,
        }),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: "Soundboard - DM Soundboard",
            filename: "index.html",
            template: "./src/index.html",
            minify: false,
            chunks: ["app", "style"],
        }),
        new HtmlWebpackPlugin({
            title: "Session - DM Soundboard",
            filename: "session.html",
            template: "./src/session.html",
            minify: false,
            chunks: ["client", "style"],
        }),
        new CopyPlugin({
            patterns: [{
                from: "src/static/*",
                to: "./static/[name].[ext]",
                toType: "template",
            }, ],
        }),
    ],
}, ]);

const devConfig = merge([{
    entry: {
        app: [
            "webpack-hot-middleware/client?path=/__webpack_hmr&timeout=1000&reload=true",
            "./src/js/index.js",
        ],
        client: [
            "webpack-hot-middleware/client?path=/__webpack_hmr&timeout=1000&reload=true",
            "./src/js/client.js",
        ],
    },
    module: {
        rules: [{
            test: /\.s[ac]ss$/i,
            use: ["style-loader", "css-loader", "sass-loader"],
        }, ],
    },
    devtool: "inline-source-map",
    plugins: [
        new webpack.DefinePlugin({
            SOCKET_PORT: process.env.SOCKET_PORT || 3000,
        }),
        new webpack.HotModuleReplacementPlugin(),
    ],
}, ]);

const prodConfig = merge([{
    output: {
        filename: "[name].[hash:4].js",
        path: path.resolve(__dirname, "dist"),
    },
    module: {
        rules: [{
            test: /\.s[ac]ss$/i,
            use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
        }, ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "style.[hash:4].css",
        }),
    ],
}, ]);

module.exports = () => {
    const mode = process.env.NODE_ENV || "development";
    console.log("Webpack mode: ", mode);
    if (mode === "production") {
        return merge(config, prodConfig, { mode });
    }
    return merge(config, devConfig, { mode });
};