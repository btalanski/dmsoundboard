const path = require("path");
const express = require("express");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const config = require("./webpack.config.js")();

const mode = process.env.NODE_ENV || "development";
const port = 8080;

const app = express();

if (mode === "development") {
    const compiler = webpack(config);
    const middleware = webpackDevMiddleware(compiler);

    app.use(middleware);
    app.use(webpackHotMiddleware(compiler));

    app.get("*", (req, res) => {
        res.write(
            middleware.fileSystem.readFileSync(
                path.join(__dirname, "dist/index.html")
            )
        );
        res.end();
    });
} else {
    app.use(express.static(__dirname + "/dist"));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "dist/index.html"));
    });
}

app.listen(port, "0.0.0.0", function onStart(err) {
    if (err) {
        console.log(err);
    }
    console.info(
        "🌎 Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.",
        port,
        port
    );
});