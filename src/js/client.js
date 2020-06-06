import "../sass/index.scss";
import io from "socket.io-client";
import { webRtcConfig as webRTC } from "./webRtcConfig";

const init = (roomId) => {
    const socket = io(window.location.origin);

    const videoPlayer = document.getElementById("videoPlayer");

    // WebRTC data
    let peerConnection;

    socket.on("connect", () => {
        console.log("connected to server");

        // Join the associated DM room
        socket.emit("join-dm-room", roomId);
<<<<<<< HEAD

        // WebRTC offer received from remote peer
        socket.on("webrtc-offer", (id, description) => {
            console.log("webrtc-offer");

            peerConnection = new RTCPeerConnection(webRTC);
            peerConnection
                .setRemoteDescription(description)
                .then(() => peerConnection.createAnswer())
                .then((sdp) => peerConnection.setLocalDescription(sdp))
                .then(() =>
                    socket.emit("webrtc-answer", id, peerConnection.localDescription)
                );

            // Attach video track to player
            peerConnection.ontrack = (event) => {
                videoPlayer.srcObject = event.streams[0];
            };

            // ICE candidate
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("webrtc-candidate", id, event.candidate);
                }
            };
        });

        // ICE candidate
        socket.on("webrtc-candidate", (id, candidate) => {
            console.log("webrtc-candidate");
            peerConnection
                .addIceCandidate(new RTCIceCandidate(candidate))
                .catch((e) => console.error(e));
        });

        socket.on("dm-session-ended", () => {
            alert("The DM ended the session. Disconecting...");
            socket.close();
        });

        socket.on("disconnectPeer", () => {
            console.log("disconnectPeer");
            peerConnection.close();
        });

        window.onunload = window.onbeforeunload = () => {
            socket.close();
        };
    });
};

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

if (roomId) {
    init(roomId);
} else {
    alert("No room to join");
}
=======
    } else {
        alert("No room to join");
    }
});
>>>>>>> Display connected players count
