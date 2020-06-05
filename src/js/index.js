import "../sass/index.scss";
import io from "socket.io-client";

const socket = io("http://localhost:" + SOCKET_PORT);