export const webRtcConfig = {
    iceServers: [{
            url: "stun:stun.l.google.com:19302",
        },
        {
            url: "turn:turn.bistri.com:80",
            credential: "homeo",
            username: "homeo",
        },
    ],
};