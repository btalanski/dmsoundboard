export const webRtcConfig = {
  iceServers: [
    {
      url: "stun:stun.l.google.com:19302",
    },
    {
      url: "turn:numb.viagenie.ca",
      credential: "muazkh",
      username: "webrtc@live.com",
    },
  ],
};
