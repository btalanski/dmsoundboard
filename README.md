# DM Soundboard
Inspired by the likes of Tabletop Audio and Syrinscape, this project aims to deliver a free open source alternative for DMs.

The soundboard allows the DM to upload files from her computer and stream it to other players over the internet.

## Features:
- Support modern browsers
- Upload of audio files
- Realtime sound composition with multiple audio sources
- Stream the audio from the soundboard to other users over the internet
- Play audio locally through the computer speakers
- Discord bot to stream audio to voice channel

## Requirements
- Node version: ^10.0.0;
- NPM version: ^6.9.0;

## To do list for v0.2.0:
- [ ] Control individual audio sources (play/pause/loop/stop/volume);
- [ ] Mix audio sources and stream;
- [ ] Add mixer master control (play/pause/loop/stop/volume);
- [ ] Create client UI;
- [ ] Improve UI socket events handling;

## To do list for v0.1.0:
- [x] HTTP server;
- [x] Webpack setup; 
- [x] Socket.io setup;
- [x] Create socket room on DM join;
- [x] Allow player to join DM room;
- [x] Basic UI interface;
- [x] Audio upload from local files;
- [x] WebRTC audio streaming;


### Reference material
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebRTC documentaiton](https://developer.mozilla.org/pt-PT/docs/Web/API/API_WebRTC)
- [Audio over WebRTC](https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/webrtc-integration.html)
- [WebRTC and Node.js: Development of a real-time video chat app](https://tsh.io/blog/how-to-write-video-chat-app-using-webrtc-and-nodejs/)
- [MediaStream Integration](https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/webrtc-integration.html)
- [Stream MP3 without uploading it to any server using HTML5 JavaScript APIs](https://github.com/eelcocramer/webrtc-mp3-stream)

