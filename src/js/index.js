import "../sass/index.scss";
import io from "socket.io-client";
import { webRtcConfig as webRTC } from "./webRtcConfig";

const socket = io(window.location.origin);

// List of socket ids from connected players
let playersConnected = [];

// WebRTC data
const peerConnections = {};
const constraints = {
    audio: false,
    video: { width: 1280, height: 720 },
};
const videoPlayer = document.getElementById("videoPlayer");

navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
        videoPlayer.srcObject = stream;
        socket.emit("broadcaster");
    })
    .catch((error) => console.error(error));

// List of socket ids from connected players
const playersConnected = [];

const updateRoomLink = (roomId) => {
    const $roomLink = document.getElementById("roomLink");
    const url = `${window.location.origin}/session.html?roomId=${roomId}`;
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
    console.log("updateConnectedPlayersDisplay");
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

// Initiates a connection request to a Peer
const connectToPeer = (peerId) => {
    console.log("connectToPeer");

    const peerConnection = new RTCPeerConnection(webRTC);

    // Stores peerId on a global state var
    peerConnections[peerId] = peerConnection;

    // Connects a video stream
    let stream = videoPlayer.srcObject;
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    // Called when we receive an ICE candidate
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("webrtc-candidate", peerId, event.candidate);
        }
    };

    // Create a connection offer, set localDescription and emit a socket event
    peerConnection
        .createOffer()
        .then((sdp) => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("webrtc-offer", peerId, peerConnection.localDescription);
        });
};

socket.on("connect", () => {
    console.log("connected to server");

    // Send request to create a new DM room
    socket.emit("create-dm-room");

    // Response from create DM room request
    socket.on("created-dm-room", (data) => updateRoomLink(data));

    // New player joined the session
    socket.on("player-joined", (playerId) => {
        console.log("player-joined", playerId);

        //Update connected players array
        playersConnected.push(playerId);
        console.log("playersConnected:", playersConnected);

        // Update UI
        updateConnectedPlayersDisplay();

        // Initialize webRTC connection
        connectToPeer(playerId);
    });

    // Player left the session
    socket.on("player-left", (playerId) => {
        console.log("player-left", playerId);

        // Update list of connected player sockets
        playersConnected = playersConnected.filter((id) => id !== playerId);
        console.log(playersConnected);

        // Update connected peers state
        if (peerConnections[playerId]) {
            peerConnections[playerId].close();
            delete peerConnections[playerId];
        }

        // Update UI
        updateConnectedPlayersDisplay();
    });

    socket.on("webrtc-answer", (id, description) => {
        console.log("webrtc-answer", id, description);
        peerConnections[id].setRemoteDescription(description);
    });

    socket.on("webrtc-candidate", (id, candidate) => {
        console.log("webrtc-candidate", id, candidate);
        peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Close the socket connection on browser window close
    window.onunload = window.onbeforeunload = () => {
        socket.close();
    };

    init();
});