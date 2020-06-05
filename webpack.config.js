const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
var merge = require("webpack-merge");

const config = merge([{
    entry: ["./src/js/index.js"],
    output: {
        filename: "app.[hash].js",
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
            title: "Join session - DM Soundboard",
            filename: "index.html",
            template: "./src/index.html",
            minify: false,
        }),
        new HtmlWebpackPlugin({
            title: "Soundboard - DM Soundboard",
            filename: "soundboard.html",
            template: "./src/soundboard.html",
            minify: false,
        }),
        new HtmlWebpackPlugin({
            title: "Session - DM Soundboard",
            filename: "session.html",
            template: "./src/session.html",
            minify: false,
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
    entry: [
        "webpack-hot-middleware/client?path=/__webpack_hmr&timeout=1000&reload=true",
    ],
    module: {
        rules: [{
            test: /\.s[ac]ss$/i,
            use: ["style-loader", "css-loader", "sass-loader"],
        }, ],
    },
    devtool: "inline-source-map",
    plugins: [new webpack.HotModuleReplacementPlugin()],
}, ]);

const prodConfig = merge([{
    entry: "./src/js/index.js",
    output: {
        filename: "app.[hash].js",
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
            filename: "style.[hash].css",
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