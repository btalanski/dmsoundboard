const path = require("path");
const http = require("http");
const express = require("express");
const app = express();

app.set("port", process.env.PORT || 8080);

if (app.get("env") === "development") {
    const webpack = require("webpack");
    const config = require(path.join(process.cwd(), "./webpack.config.js"))();
    const compiler = webpack(config);

    app.use(
        require("webpack-dev-middleware")(compiler, {
            hot: true,
            stats: config.stats,
            publicPath: config.output.publicPath,
        })
    );
    app.use(require("webpack-hot-middleware")(compiler));
} else {
    app.use(express.static(process.cwd() + "/dist"));
    app.get("*", (req, res) => {
        res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
}

const server = http.createServer(app);
const socket = require("./socket")(server);

server.listen(app.get("port"), function() {
    console.log("Server listening on port " + app.get("port"));
});