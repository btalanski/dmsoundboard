import "../sass/index.scss";
import io from "socket.io-client";

const socket = io("http://localhost:" + SOCKET_PORT);

const updateRoomLink = (roomId) => {
    const $roomLink = document.getElementById("roomLink");
    const url = `http://0.0.0.0:8080/session.html?roomId=${roomId}`;
    $roomLink.innerHTML = url;
    $roomLink.href = url;
};

socket.on("connect", () => {
    console.log("connected to server");
    socket.emit("create-dm-room", {});
    socket.on("created-dm-room", (data) => updateRoomLink(data));
});