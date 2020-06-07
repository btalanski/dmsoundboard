import "../sass/index.scss";
import io from "socket.io-client";
import { BufferLoader, audioContext, finishedLoading } from "./audio";

const socket = io("http://localhost:" + SOCKET_PORT);
const audioSources = [];

const playExperiment = () => {
  const testSources = [];
  const requests = [];

  audioSources.map((item) => requests.push(new Request(item)));

  requests.map((req, index) => {
    fetch(req)
      .then((response) => {
        return response.arrayBuffer();
      })
      .then((buffer) => {
        audioContext.decodeAudioData(buffer, (decodedAudioData) => {
          testSources[index] = audioContext.createBufferSource();
          testSources[index].buffer = decodedAudioData;
          testSources[index].connect(audioContext.destination);
          testSources[index].start();
        });
      });
  });

  console.log('###END', audioContext, testSources);
};

const setExperimentCallback = () => {
  const action = document.getElementById("playExperiment");
  action.addEventListener("click", playExperiment);
};

// List of socket ids from connected players
let playersConnected = [];

const updateRoomLink = (roomId) => {
  const $roomLink = document.getElementById("roomLink");
  const url = `http://0.0.0.0:8080/session.html?roomId=${roomId}`;
  $roomLink.innerHTML = url;
  $roomLink.href = url;
};

const createAudioExperimentPlayer = () => {
  const count = document.getElementsByClassName("audio-experiment");
  const player = document.createElement("audio");
  player.id = `audio-player-${count.length}`;
  player.classList.add("audio-experiment");
  player.controls = true;
  player.loop = true;
  return player;
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
  reader.onloadend = function (file) {
    console.log("###FILE", file);
    player.src = file.target.result;
    audioSources.push(file.target.result);
    // player.play();
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

    socket.on("player-joined", (playerId) => {
        console.log("player-joined", playerId);
        playersConnected.push(playerId);
        updateConnectedPlayersDisplay();
    });

    socket.on("player-left", (playerId) => {
        console.log("player-left", playerId);
        playersConnected = playersConnected.filter((id) => id !== playerId);
        updateConnectedPlayersDisplay();
    });

    init();
});
