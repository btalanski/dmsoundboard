import io from "socket.io-client";
import adapter from "webrtc-adapter";
import "../sass/index.scss";

// import {
//     removeBandwidthRestriction,
//     updateBandwidthRestriction,
// } from "./bandwidth-controls";
import { TimelineDataSeries, TimelineGraphView } from "../third-party/graph";
import { webRtcConfig as webRTC } from "./common/webRtcConfig";
import { audioContext } from "./common/audio";
import { playBtnIcon, stopBtnIcon } from "./common/icons";
// Setup socket
const socket = io(window.location.origin);

// This is appended to our webRTC audio stream
const mediaStreamDestination = audioContext.createMediaStreamDestination();

// Audio sources
const audioSources = [];
// Gain Nodes
const gainNodes = [];

// List of socket ids from connected players
let connectedPlayers = 0;
// WebRTC data
const peerConnections = {};

// Bandwith controls
const bandwidthSelector = document.querySelector("select#bandwidth");
// let maxBandwidth = 0;

let bitrateGraph;
let bitrateSeries;
let headerrateSeries;

let packetGraph;
let packetSeries;

let lastResult;

let canWatchGraphs = false;

const updateRoomLink = (roomId) => {
  const $roomLink = document.getElementById("roomLink");
  const url = `${window.location.origin}/session.html?roomId=${roomId}`;
  $roomLink.innerHTML = url;
  $roomLink.href = url;
};

// To do: How can this be improved ?
const createSoundBoardItem = (count) => {
  console.log("createSoundBoardItem");

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
  loopLabel.innerHTML = "Loop";
  const loopControl = document.createElement("input");
  loopControl.type = "checkbox";
  loopControl.id = `loopControl[${count}]`;
  loopControl.name = `loopControl[${count}]`;
  loopControl.checked = true;

  loopControl.addEventListener("change", function (e) {
    // To do: New way to loop based on audio source
    const index = e.target.name.match(/\d+/g); //regex to extract a number from a string
    audioSources[index].loop = e.target.checked;
  });

  loopLabel.prepend(loopControl);
  loopWrapper.append(loopLabel);

  item.append(itemName);
  item.append(loopWrapper);

  // Controls
  const controlsWrapper = document.createElement("div");
  controlsWrapper.classList.add("controls-wrapper");

  // Play control
  const playControl = document.createElement("span");
  playControl.setAttribute("targetAudio", count);

  const playIcon = document.createElement("img");
  playIcon.src = playBtnIcon;

  playControl.append(playIcon);
  playControl.addEventListener("click", function () {
    console.log("play btn clicked");
    const target = this.getAttribute("targetAudio");
    if (!audioSources[target].isPlaying) {
      // Can't play a buffer node source if it was previously stopped
      // A new node needs to be created and started
      const newSource = audioContext.createBufferSource();
      newSource.buffer = audioSources[target].buffer;

      // Disconnect old source from context
      audioSources[target].disconnect(audioContext.destination);
      audioSources[target].disconnect(mediaStreamDestination);

      // Connects the new source to the context and start it
      newSource.connect(audioContext.destination);
      newSource.connect(mediaStreamDestination);
      newSource.start();

      // Replace source
      audioSources[target] = newSource;
      audioSources[target].isPlaying = true;
      audioSources[target].loop = document.getElementById(
        `loopControl[${target}]`
      ).checked;
    }
  });
  controlsWrapper.append(playControl);

  // Stop control
  const stopControl = document.createElement("span");
  stopControl.setAttribute("targetAudio", count);

  const stopIcon = document.createElement("img");
  stopIcon.src = stopBtnIcon;

  stopControl.append(stopIcon);
  stopControl.addEventListener("click", function () {
    console.log("stop clicked");
    const target = this.getAttribute("targetAudio");
    if (audioSources[target].isPlaying) {
      audioSources[target].isPlaying = false;
      audioSources[target].stop();
    }
  });

  // Volume Control
  const volumeControlWrapper = document.createElement("div");
  const volumeControlInput = document.createElement("input");
  volumeControlInput.type = 'range';
  volumeControlInput.min = 0;
  volumeControlInput.max = 100;
  volumeControlInput.value = 100;
  volumeControlInput.setAttribute("targetAudio", count);
  volumeControlInput.style.backgroundColor = '#FFF';
  const volumeControlLabel = document.createElement("label");
  volumeControlLabel.innerText = "Volume";
  volumeControlLabel.classList.add("volumeLabel");

  volumeControlInput.addEventListener("change", function (event) {
    const audioSource = audioSources[count];
    const gainNode = audioContext.createGain();

    // Connect source to a gain node
    audioSource.connect(gainNode);
    // Connect gain node to destination
    gainNode.connect(audioContext.destination);

    const volume = event.target.value;
    const fraction = parseInt(volume) / parseInt(event.target.max);
    // Let's use an x*x curve (x-squared) since simple linear (x) does not
    // sound as good.
    gainNode.gain.value = fraction * fraction;
    console.log('###DEBUG', gainNode.gain.value, fraction * fraction);
  });

  controlsWrapper.append(stopControl);
  // Appending volume control elements
  volumeControlWrapper.append(volumeControlLabel);
  volumeControlWrapper.append(volumeControlInput);
  controlsWrapper.append(volumeControlWrapper);

  item.append(controlsWrapper);

  return item;
};

// To do: Can this be improved ?
const addSoundBoardItem = (file) => {
  console.log("addSoundBoardItem");
  preloadAudioAndConnectToStreamDestination(file).then((source) => {
    audioSources.push(source);
    const $soundBoardItem = createSoundBoardItem(audioSources.length - 1);
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
        source.isPlaying = true;
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

const updateConnectedPlayersDisplay = (connectedPlayers) => {
  console.log("updateConnectedPlayersDisplay");
  document.getElementById("connectedPlayers").innerHTML = connectedPlayers;
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
  muteAudio.addEventListener("change", function () {
    console.log("muteAudio");
    const muteInfo = document.getElementById("muteInfo");
    if (this.checked) {
      muteInfo.innerHTML = "Unmute audio";
      gainNode.gain.setValueAtTime(-1, audioContext.currentTime);
    } else {
      muteInfo.innerHTML = "Mute audio";
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    }
  });
};

const setupDragAndDropUpload = () => {
  const $dropElem = document.getElementById("dropUpload");
  $dropElem.addEventListener(
    "dragover",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
    },
    false
  );
  $dropElem.addEventListener(
    "dragenter",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
    },
    false
  );
  $dropElem.addEventListener(
    "dragleave",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
    },
    false
  );
  $dropElem.addEventListener(
    "drop",
    function (event) {
      handleDropUpload(event.dataTransfer.files);
      event.preventDefault();
      event.stopPropagation();
    },
    false
  );
};
const handleDropUpload = (files) => {
  for (let i = 0; i < files.length; i++) {
    addSoundBoardItem(files[i]);
  }
};

const setupBandwidthDisplayControls = () => {
  const displayControl = document.getElementById("displayBandwidthControls");
  displayControl.checked = false;

  displayControl.addEventListener("click", function () {
    const bandwidthControls = document.getElementById("bandwithContainer");
    if (this.checked != true) {
      bandwidthControls.classList.add("hidden");
    } else {
      bandwidthControls.classList.remove("hidden");
    }
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

const bootstrap = () => {
  console.log("init app...");
  setupMasterAudioControls();
  setupDragAndDropUpload();
  setupBandwidthDisplayControls();
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
    bandwidthSelector.disabled = false;
    enableBandwidthControls(playerId);

    //Update connected players display
    connectedPlayers += 1;
    updateConnectedPlayersDisplay(connectedPlayers);

    // Initialize webRTC connection
    connectToPeer(playerId);
  });

  // Player left the session
  socket.on("player-left", (playerId) => {
    console.log("player-left", playerId);
    console.log(connectedPlayers);
    //Update connected players display
    connectedPlayers -= 1;
    connectedPlayers = connectedPlayers <= -1 ? 0 : connectedPlayers;
    updateConnectedPlayersDisplay(connectedPlayers);

    // Update connected peers state
    if (peerConnections[playerId]) {
      peerConnections[playerId].close();
      delete peerConnections[playerId];
    }

    // disables bandwith controls when we have 0 players
    if (connectedPlayers === 0) bandwidthSelector.disabled = true;
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
    //Close socket connection
    socket.close();

    //Close audio context
    audioContext.close().then(function () {
      console.log("audioContext closed");
    });

    //Close peer connections
    Object.keys(peerConnections).forEach((peer) =>
      peerConnections[peer].close()
    );
  };
});

socket.on("connect_error", (err) => {
  console.log(err);
});
socket.on("connect_failed", (err) => {
  console.log(err);
});

// Query getStats every second
// TODO: Look for a way to achieve the same results without a setInterval
window.setInterval(() => {
  if (canWatchGraphs) {
    //TODO: This needs to be refactored to handle all peers.
    const currentConnection =
      connectedPlayers > 0
        ? peerConnections[Object.keys(peerConnections)[0]]
        : {};

    if (!currentConnection) {
      return;
    }

    // What is this sender?
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender
    const sender = currentConnection.getSenders()[0];

    if (!sender) {
      return;
    }

    console.log("###SENDER", sender);
    sender.getStats().then((res) => {
      res.forEach((report) => {
        let bytes;
        let headerBytes;
        let packets;
        if (report.type === "outbound-rtp") {
          if (report.isRemote) {
            return;
          }

          const now = report.timestamp;
          bytes = report.bytesSent;
          headerBytes = report.headerBytesSent;

          packets = report.packetsSent;
          if (lastResult && lastResult.has(report.id)) {
            // calculate bitrate
            const bitrate =
              (8 * (bytes - lastResult.get(report.id).bytesSent)) /
              (now - lastResult.get(report.id).timestamp);
            const headerrate =
              (8 * (headerBytes - lastResult.get(report.id).headerBytesSent)) /
              (now - lastResult.get(report.id).timestamp);

            // append to chart
            bitrateSeries.addPoint(now, bitrate);
            headerrateSeries.addPoint(now, headerrate);
            bitrateGraph.setDataSeries([bitrateSeries, headerrateSeries]);
            bitrateGraph.updateEndDate();

            // calculate number of packets and append to chart
            packetSeries.addPoint(
              now,
              packets - lastResult.get(report.id).packetsSent
            );
            packetGraph.setDataSeries([packetSeries]);
            packetGraph.updateEndDate();
          }
        }
      });
      lastResult = res;
    });
  }
}, 1000);

// TODO: Simplify/improve readability
const enableBandwidthControls = (playerId) => {
  // Fire up the graph visualizations
  bitrateSeries = new TimelineDataSeries();
  bitrateGraph = new TimelineGraphView("bitrateGraph", "bitrateCanvas");
  bitrateGraph.updateEndDate();

  headerrateSeries = new TimelineDataSeries();
  headerrateSeries.setColor("green");

  packetSeries = new TimelineDataSeries();
  packetGraph = new TimelineGraphView("packetGraph", "packetCanvas");
  packetGraph.updateEndDate();

  // TODO: Refactor to handle all peer connections.
  // Renegotiate bandwidth on the fly.
  bandwidthSelector.onchange = () => {
    bandwidthSelector.disabled = true;
    const bandwidth =
      bandwidthSelector.options[bandwidthSelector.selectedIndex].value;

    // In Chrome, use RTCRtpSender.setParameters to change bandwidth without
    // (local) renegotiation. Note that this will be within the envelope of
    // the initial maximum bandwidth negotiated via SDP.
    if (
      (adapter.browserDetails.browser === "chrome" ||
        adapter.browserDetails.browser === "safari" ||
        (adapter.browserDetails.browser === "firefox" &&
          adapter.browserDetails.version >= 64)) &&
      "RTCRtpSender" in window &&
      "setParameters" in window.RTCRtpSender.prototype
    ) {
      const currentConnection = peerConnections[playerId];
      let keys = Object.keys(peerConnections);
      let connectionsSenders = [];
      let connectionsSendersParameters = [];

      for (let key of keys) {
        //in this case, we have always only one track because it is an audio streaming
        // that is why we use [0];
        connectionsSenders.push(peerConnections[key].getSenders()[0]);
        connectionsSendersParameters.push(
          peerConnections[key].getSenders()[0].getParameters()
        );
      }

      // Loop over all connections and set the new parameters
      connectionsSendersParameters.map((parameters, index) => {
        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }
        if (bandwidth === "unlimited") {
          delete parameters.encodings[0].maxBitrate;
        } else {
          parameters.encodings[0].maxBitrate = bandwidth * 1000;
        }

        connectionsSenders[index]
          .setParameters(parameters)
          .then(() => {
            console.log("###Bandwidth updated!");
            bandwidthSelector.disabled = false;
            canWatchGraphs = true;
          })
          .catch((e) => console.error("Bandwidth update params failed: ", e));
      });
      return;
    }

    // TODO: Properly test this fallback and refactor to handle multiple connections
    // Fallback to the SDP munging with local renegotiation way of limiting
    // the bandwidth.
    // currentConnection
    //   .createOffer()
    //   .then((offer) => currentConnection.setLocalDescription(offer))
    //   .then(() => {
    //     const desc = {
    //       type: currentConnection.remoteDescription.type,
    //       sdp:
    //         bandwidth === "unlimited"
    //           ? removeBandwidthRestriction(
    //               currentConnection.remoteDescription.sdp
    //             )
    //           : updateBandwidthRestriction(
    //               currentConnection.remoteDescription.sdp,
    //               bandwidth
    //             ),
    //     };
    //     console.log(
    //       "Applying bandwidth restriction to setRemoteDescription:\n" + desc.sdp
    //     );
    //     return currentConnection.setRemoteDescription(desc);
    //   })
    //   .then(() => {
    //     bandwidthSelector.disabled = false;
    //     canWatchGraphs = true;
    //   })
    //   .catch(onSetSessionDescriptionError);
  };
};
