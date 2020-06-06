import "../sass/index.scss";
import io from "socket.io-client";

const socket = io("http://localhost:" + SOCKET_PORT);

// List of socket ids from connected players
const playersConnected = [];

const updateRoomLink = (roomId) => {
    const $roomLink = document.getElementById("roomLink");
    const url = `http://0.0.0.0:8080/session.html?roomId=${roomId}`;
    $roomLink.innerHTML = url;
    $roomLink.href = url;
};

const createAudioPlayer = () => {
    const count = document.getElementsByClassName("audio-player");
    const player = document.createElement("audio");
    player.id = `audio-player-${count.length}`;
    player.classList.add("audio-player");
    player.controls = true;
    player.loop = true;
    return player;
};

const createSoundBoardItem = () => {
    const count = document.getElementsByClassName("item-name");

    const item = document.createElement("div");
    item.classList.add("item");

    const itemName = document.createElement("input");
    itemName.value = `Audio ${count.length + 1}`;
    item.id = `inputName[${count.length}]`;
    item.name = `inputName[${count.length}]`;
    itemName.classList.add("item-name");

    item.append(itemName);

    return item;
};

const addSoundBoardItem = (userFile) => {
    console.log(userFile);
    const $board = document.getElementById("soundboard");
    const player = createAudioPlayer();
    const $soundBoardItem = createSoundBoardItem();
    $soundBoardItem.append(player);

    const reader = new FileReader();
    reader.onloadend = function(file) {
        player.src = file.target.result;
        player.play();
    };
    reader.readAsDataURL(userFile.files[0]);

    $board.append($soundBoardItem);
};

const updateConnectedPlayersDisplay = () => {
    const $elem = document.getElementById("connectedPlayers");
    $elem.innerHTML = playersConnected.length;
};

const init = () => {
    console.log("init app...");
    const $audioInput = document.getElementById("audioInput");
    $audioInput.addEventListener("change", function() {
        addSoundBoardItem(this);
    });

    updateConnectedPlayersDisplay();
};

socket.on("connect", () => {
    console.log("connected to server");
    socket.emit("create-dm-room", {});
    socket.on("created-dm-room", (data) => updateRoomLink(data));

    socket.on("player-joined", (data) => {
        console.log("player-joined");
        console.log(data);
        playersConnected.push(data);
        updateConnectedPlayersDisplay();
    });
    init();
});