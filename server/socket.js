module.exports = (server) => {
    const io = require("socket.io")(server);
    io.listen(process.env.SOCKET_PORT || 3000);

    const dmRoomsMap = [];
    const roomExists = (roomId) => io.nsps["/"].adapter.rooms[roomId];

    const findRoom = (roomId) => {
        const found = dmRoomsMap.find(({ id }) => id === roomId);
        if (found) {
            return found;
        }
        return null;
    };
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

            dmRoomsMap.push({
                id: roomId,
                dm: socket.id,
            });

            socket.join(roomId);
            socket.emit("created-dm-room", roomId);
        });

        socket.on("join-dm-room", (roomId) => {
            console.log("join-dm-room", roomId);

            const room = findRoom(roomId);
            if (room) {
                socket.join(roomId);
                socket.to(room.dm).emit("player-joined", socket.id);
            }
        });

        socket.on("disconnect", () => {
            io.emit("player-left", socket.id);
        });

        // WebRTC Peer candidate data
        socket.on("webrtc-candidate", (id, message) => {
            socket.to(id).emit("webrtc-candidate", socket.id, message);
        });

        // WebRTC Peer offer data
        socket.on("webrtc-offer", (id, message) => {
            socket.to(id).emit("webrtc-offer", socket.id, message);
        });

        socket.on("webrtc-answer", (id, message) => {
            socket.to(id).emit("webrtc-answer", socket.id, message);
        });
    });

    return io;
};