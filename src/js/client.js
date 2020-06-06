import io from "socket.io-client";
const socket = io("http://localhost:" + SOCKET_PORT);

socket.on("connect", () => {
    console.log("connected to server");

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");

    if (roomId) {
        socket.emit("join-dm-room", roomId);
    } else {
        alert("No room to join");
    }
});