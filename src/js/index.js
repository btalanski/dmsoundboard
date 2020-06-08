import "../sass/index.scss";
import io from "socket.io-client";
import { webRtcConfig as webRTC } from "./webRtcConfig";
import { audioContext } from "./audio";

const socket = io(window.location.origin);

// This is appended to our webRTC audio stream
const mediaStreamDestination = audioContext.createMediaStreamDestination();

// List of socket ids from connected players
let playersConnected = [];

// WebRTC data
const peerConnections = {};

const updateRoomLink = (roomId) => {
    const $roomLink = document.getElementById("roomLink");
    const url = `${window.location.origin}/session.html?roomId=${roomId}`;
    $roomLink.innerHTML = url;
    $roomLink.href = url;
};

const createAudioPlayer = (audioFile) => {
    const count = document.getElementsByClassName("audio-player").length;
    const audio = new Audio();
    audio.id = `audioPlayer[${count}]`;
    audio.classList.add("audio-player");
    audio.controls = true;
    audio.loop = true;
    return preloadAudioAndConnectToStreamDestination(audioFile, audio);
};

// To do: How can this be improved ?
const createSoundBoardItem = (player) => {
    console.log("createSoundBoardItem");
    const count = document.getElementsByClassName("item-name").length;

    const item = document.createElement("div");
    item.classList.add("item");

    const itemName = document.createElement("input");
    itemName.value = `Audio ${count + 1}`;
    item.id = `inputName[${count}]`;
    item.name = `inputName[${count}]`;
    itemName.classList.add("item-name");

    const loopWrapper = document.createElement("div");
    loopWrapper.classList.add("loop-wrapper");

    const loopLabel = document.createElement("label");
    loopLabel.htmlFor = `loopControl[${count}]`;

    const loopControl = document.createElement("input");
    loopControl.type = "checkbox";
    loopControl.id = `loopControl[${count}]`;
    loopControl.name = `loopControl[${count}]`;
    loopControl.checked = true;

    loopControl.addEventListener("change", function() {
        player.loop = this.checked;
    });

    loopLabel.append(loopControl);
    loopLabel.append("Loop");
    loopWrapper.append(loopLabel);

    item.append(itemName);
    item.append(player);
    item.append(loopWrapper);

    return item;
};

// To do: Can this be improved ?
const addSoundBoardItem = (userFile) => {
    console.log("addSoundBoardItem");
    const $board = document.getElementById("soundboard");
    const player = createAudioPlayer(userFile.files[0]);
    const $soundBoardItem = createSoundBoardItem(player);
    $board.append($soundBoardItem);
};

// To do: Can this be improved ?
const preloadAudioAndConnectToStreamDestination = (file, audioElem) => {
    console.log("preloadAudioAndConnectToStreamDestination");
    const reader = new FileReader();
    reader.onloadend = function(file) {
        // Sets the audio player source and start playing the track
        audioElem.src = file.target.result;
        audioElem.play();

        // We need to connect the sound output to our webRTC stream destination
        // so the other peers can receive the audio
        const source = audioContext.createMediaElementSource(audioElem);
        source.connect(mediaStreamDestination);
    };

    reader.readAsDataURL(file);

    return audioElem;
};

const updateConnectedPlayersDisplay = () => {
    console.log("updateConnectedPlayersDisplay");
    const $elem = document.getElementById("connectedPlayers");
    $elem.innerHTML = playersConnected.length;
};

const init = () => {
    console.log("init app...");

    document.getElementById("audioInput").addEventListener("change", function() {
        addSoundBoardItem(this);
    });
};

// Initiates a connection request to a Peer
const connectToPeer = (peerId) => {
    console.log("connectToPeer");

    const peerConnection = new RTCPeerConnection(webRTC);

    // Stores peerId on a global state var
    peerConnections[peerId] = peerConnection;

    // Create an empty MediaStream so we can send the initial audio track
    // to the connected peer
    const stream = new MediaStream();
    const track = mediaStreamDestination.stream.getAudioTracks()[0];
    peerConnection.addTrack(track, stream);

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