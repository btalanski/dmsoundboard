module.exports = (server) => {
    const io = require("socket.io")(server);
    io.listen(process.env.SOCKET_PORT || 3000);

    const roomsMap = [];
    const roomExists = (roomId) => io.nsps["/"].adapter.rooms[roomId];
    const findRoomIndex = (roomId) =>
        roomsMap.findIndex(({ id }) => id === roomId);

    const generateRoomId = () => {
        const roomId = require("shortid").generate();
        if (roomExists(roomId)) {
            generateRoomId();
            return;
        }
        return roomId;
    };

    const createRoom = (socket) => {
        const roomId = generateRoomId();

        roomsMap.push({
            id: roomId,
            owner: socket.id,
            connections: [socket.id],
        });

        return roomId;
    };

    const addRoomConnection = (roomId, socket) => {
        const index = findRoomIndex(roomId);

        if (index >= 0) {
            const isConnected = roomsMap[index].connections.find(
                (id) => id === socket.id
            );

            if (!isConnected) {
                roomsMap[index].connections.push(socket.id);
                console.log(roomsMap[index]);
                socket.join(roomId);
                socket.to(roomsMap[index].owner).emit("player-joined", socket.id);
            }
        }
    };

    const removeRoomConnection = (socket) => {
        const roomIndex = roomsMap.findIndex(({ connections = [] }) =>
            connections.find((c) => c === socket.id)
        );

        if (roomIndex >= 0) {
            const { owner, id } = roomsMap[roomIndex];
            const isOwner = owner === socket.id;

            if (isOwner) {
                io.to(id).emit("dm-session-ended");
            } else {
                roomsMap[roomIndex].connections = roomsMap[
                    roomIndex
                ].connections.filter((c) => c !== socket.id);
                socket.to(owner).emit("player-left", socket.id);
            }
        }
    };

    io.on("connection", (socket) => {
        console.log("user connected");
        const { id } = socket;

        socket.on("create-dm-room", () => {
            console.log("create-dm-room");
            const roomId = createRoom(socket);
            socket.join(roomId);
            socket.emit("created-dm-room", roomId);
        });

        socket.on("join-dm-room", (roomId) => {
            console.log("join-dm-room", roomId);
            addRoomConnection(roomId, socket);
        });

        socket.on("disconnect", () => {
            console.log("disconnect");
            removeRoomConnection(socket);
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