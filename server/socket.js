module.exports = (server) => {
    const io = require("socket.io")(server);
    io.listen(process.env.SOCKET_PORT || 3000);
    io.on("connection", () => {
        console.log("user connected");
    });
    return io;
};