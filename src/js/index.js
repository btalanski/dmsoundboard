import "../sass/index.scss";
import io from "socket.io-client";
import { webRtcConfig as webRTC } from "./common/webRtcConfig";
import { audioContext } from "./common/audio";

const socket = io(window.location.origin);

// This is appended to our webRTC audio stream
const mediaStreamDestination = audioContext.createMediaStreamDestination();

// Audio sources
const audioSources = [];

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
        // To do: New way to loop based on audio source
    });

    loopLabel.append(loopControl);
    loopLabel.append("Loop");
    loopWrapper.append(loopLabel);

    item.append(itemName);
    item.append(loopWrapper);

    return item;
};

// To do: Can this be improved ?
const addSoundBoardItem = (file) => {
    console.log("addSoundBoardItem");
    preloadAudioAndConnectToStreamDestination(file).then((source) => {
        audioSources.push(source);
        const $soundBoardItem = createSoundBoardItem();
        document.getElementById("soundboard").append($soundBoardItem);
    });
};

// To do: Can this be improved ?
const preloadAudioAndConnectToStreamDestination = (file) => {
    console.log("preloadAudioAndConnectToStreamDestination");
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            audioContext.decodeAudioData(reader.result).then((buffer) => {
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.loop = true;
                source.start(0);
                // We need to connect the sound output to our webRTC stream destination
                // so the other peers can receive the audio
                source.connect(audioContext.destination);
                source.connect(mediaStreamDestination);
                // Push to array
                resolve(source);
            });
        };

        reader.onerror = reject;

        reader.readAsArrayBuffer(file);
    });
};

const updateConnectedPlayersDisplay = (playersConnected = []) => {
    console.log("updateConnectedPlayersDisplay");
    const $elem = document.getElementById("connectedPlayers");
    $elem.innerHTML = playersConnected.length;
};

const setupMasterAudioControls = () => {
    // Setup for Master audio controls
    const source = audioContext.createMediaStreamSource(
        mediaStreamDestination.stream
    );
    const gainNode = audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const muteAudio = document.getElementById("muteAudio");
    muteAudio.checked = false;
    muteAudio.addEventListener("change", function() {
        console.log("muteAudio");
        const muteLabel = document.getElementById("muteLabel");
        if (this.checked) {
            muteLabel.innerHTML = "Unmute audio";
            gainNode.gain.setValueAtTime(-1, audioContext.currentTime);
        } else {
            muteLabel.innerHTML = "Mute audio";
            gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        }
    });
};

const handleDropUpload = (files) => {
    for (let i = 0; i < files.length; i++) {
        addSoundBoardItem(files[i]);
    }
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

const bootstrap = () => {
    console.log("init app...");

    setupMasterAudioControls();

    const $dropElem = document.getElementById("dropUpload");
    $dropElem.addEventListener(
        "dragover",
        function(event) {
            event.preventDefault();
            event.stopPropagation();
        },
        false
    );
    $dropElem.addEventListener(
        "dragenter",
        function(event) {
            event.preventDefault();
            event.stopPropagation();
        },
        false
    );
    $dropElem.addEventListener(
        "dragleave",
        function(event) {
            event.preventDefault();
            event.stopPropagation();
        },
        false
    );
    $dropElem.addEventListener(
        "drop",
        function(event) {
            handleDropUpload(event.dataTransfer.files);
            event.preventDefault();
            event.stopPropagation();
        },
        false
    );
};
// Initial setup
bootstrap();

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

        // Update UI
        updateConnectedPlayersDisplay(playersConnected);

        // Initialize webRTC connection
        connectToPeer(playerId);
    });

    // Player left the session
    socket.on("player-left", (playerId) => {
        console.log("player-left", playerId);

        // Update list of connected player sockets
        playersConnected = playersConnected.filter((id) => id !== playerId);

        // Update connected peers state
        if (peerConnections[playerId]) {
            peerConnections[playerId].close();
            delete peerConnections[playerId];
        }

        // Update UI
        updateConnectedPlayersDisplay(playersConnected);
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
    window.onbeforeunload = () => {
        socket.close();
        audioContext.close().then(function() {
            console.log("audioContext closed");
        });
    };
});

socket.on("connect_error", (err) => {
    console.log(err);
});
socket.on("connect_failed", (err) => {
    console.log(err);
});