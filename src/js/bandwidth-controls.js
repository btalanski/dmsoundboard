import adapter from "webrtc-adapter";

// Wondering what is SDP?
// https://en.wikipedia.org/wiki/Session_Description_Protocol

//TODO: Describe what this regex is doing
export function removeBandwidthRestriction(sdp) {
  return sdp.replace(/b=AS:.*\r\n/, "").replace(/b=TIAS:.*\r\n/, "");
}

//TODO: Describe what this regex is doing
export function updateBandwidthRestriction(sdp, bandwidth) {
  let modifier = "AS";
  if (adapter.browserDetails.browser === "firefox") {
    bandwidth = (bandwidth >>> 0) * 1000;
    modifier = "TIAS";
  }
  if (sdp.indexOf("b=" + modifier + ":") === -1) {
    // insert b= after c= line.
    sdp = sdp.replace(
      /c=IN (.*)\r\n/,
      "c=IN $1\r\nb=" + modifier + ":" + bandwidth + "\r\n"
    );
  } else {
    sdp = sdp.replace(
      new RegExp("b=" + modifier + ":.*\r\n"),
      "b=" + modifier + ":" + bandwidth + "\r\n"
    );
  }
  return sdp;
}

export default { removeBandwidthRestriction, updateBandwidthRestriction };
