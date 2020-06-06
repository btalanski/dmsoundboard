const path = require("path");
const http = require("http");
const express = require("express");
const app = express();

app.set("port", process.env.PORT || 8080);

console.log(process.cwd());
if (app.get("env") === "development") {
    const webpack = require("webpack");
    const config = require(path.join(process.cwd(), "./webpack.config.js"))();
    const compiler = webpack(config);
    const webpackDevMiddleware = require("webpack-dev-middleware")(compiler, {
        hot: true,
        noInfo: true,
        publicPath: config.output.publicPath,
    });

    app.use(webpackDevMiddleware);
    app.use(
        require("webpack-hot-middleware")(compiler, {
            log: console.log,
            path: "/__webpack_hmr",
            heartbeat: 10 * 1000,
        })
    );
    app.use(express.static(path.join(process.cwd(), "./dist")));
} else {
    app.use(express.static(path.join(process.cwd(), "/dist")));

    app.get("/join", (req, res) => {
        res.sendFile(path.join(process.cwd(), "dist/session.html"));
    });
}

const server = http.createServer(app);
const socket = require("./socket")(server);

server.listen(app.get("port"), function() {
    console.log("Server listening on port " + app.get("port"));
});