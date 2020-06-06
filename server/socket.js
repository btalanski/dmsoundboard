module.exports = (server) => {
    const io = require("socket.io")(server);
    io.listen(process.env.SOCKET_PORT || 3000);

    const roomExists = (roomId) => io.nsps["/"].adapter.rooms[roomId];

    const generateRoomId = () => {
        const id = require("shortid").generate();
        const roomId = `room-${id}`;
        if (roomExists(roomId)) {
            generateRoomId();
            return;
        }
        return id;
    };

    io.on("connection", (socket) => {
        console.log("user connected");

        socket.on("create-dm-room", () => {
            console.log("create-dm-room");
            const shortid = require("shortid");
            const roomId = generateRoomId();
            socket.join(roomId);
            socket.emit("created-dm-room", roomId);
        });
    });

    return io;
};