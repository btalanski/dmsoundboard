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
        const { id } = socket;

        socket.on("create-dm-room", () => {
            console.log("create-dm-room");
            const shortid = require("shortid");
            const roomId = generateRoomId();
            socket.join(roomId);
            socket.emit("created-dm-room", roomId);
        });

        socket.on("join-dm-room", (roomId) => {
            console.log("join-dm-room", roomId);
            socket.join(roomId);
            socket.broadcast.emit("player-joined", id);
        });

        socket.on("disconnect", () => {
            io.emit("player-left", id);
        });
    });

    return io;
};