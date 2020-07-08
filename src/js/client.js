// TODO: Change implementation to remove the eslint-disable-next-line
import '../sass/index.scss';
import io from 'socket.io-client';
import webRtcConfig from './common/webRtcConfig';

const init = (roomId) => {
  const socket = io(window.location.origin);
  const audioPlayer = document.getElementById('audioPlayer');

  // WebRTC data
  let peerConnection;

  socket.on('connect', () => {
    console.log('connected to server');

    // Join the associated DM room
    socket.emit('join-dm-room', roomId);

    // WebRTC offer received from remote peer
    socket.on('webrtc-offer', (id, description) => {
      console.log('webrtc-offer');

      peerConnection = new RTCPeerConnection(webRtcConfig);
      peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then((sdp) => peerConnection.setLocalDescription(sdp))
        .then(() => socket.emit('webrtc-answer', id, peerConnection.localDescription));

      // Attach track to player
      peerConnection.ontrack = ({ streams }) => {
        console.log('ontrack');
        const [stream] = streams;
        audioPlayer.srcObject = stream;
        audioPlayer.play();
      };

      // ICE candidate
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-candidate', id, event.candidate);
        }
      };
    });

    // ICE candidate
    socket.on('webrtc-candidate', (id, candidate) => {
      console.log('webrtc-candidate');
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => console.error(e));
    });

    socket.on('dm-session-ended', () => {
      // TODO: Implement custom modal
      // eslint-disable-next-line
      alert('The DM ended the session. Disconnecting...');
      socket.close();
    });

    socket.on('disconnectPeer', () => {
      console.log('disconnectPeer');
      peerConnection.close();
    });

    window.onbeforeunload = () => socket.close();
    window.onunload = () => socket.close();
  });
};

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');

if (roomId) {
  init(roomId);
} else {
  // TODO: Implement a custom modal to avoid using alert()
  // eslint-disable-next-line
  alert('No room to join');
}
