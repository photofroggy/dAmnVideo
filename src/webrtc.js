/**
 * webRTC objects
 */
dVideo.RTC = {
    PeerConnection: null,
    SessionDescription: null,
    IceCandidate: null,
}

dVideo._gum = function() {};

dVideo.getUserMedia = function( options, success, error ) {

    return dVideo._gum( options, success, error );

};

if( window.mozRTCPeerConnection ) {
    dVideo.RTC.PeerConnection = mozRTCPeerConnection;
    dVideo.RTC.SessionDescription = mozRTCSessionDescription;
    dVideo.RTC.IceCandidate = mozRTCIceCandidate;
    
    dVideo._gum = function( options, success, error ) {
    
        return navigator.mozGetUserMedia( options, success, error );
    
    };
    
}

if( window.webkitRTCPeerConnection ) {
    dVideo.RTC.PeerConnection = webkitRTCPeerConnection;
    
    dVideo._gum = function( options, success, error ) {
    
        return navigator.webkitGetUserMedia( options, success, error );
    
    };
}

if( window.RTCPeerConnection ) {
    dVideo.RTC.PeerConnection = RTCPeerConnection;
    
    dVideo._gum = function( options, success, error ) {
    
        return navigator.getUserMedia( options, success, error );
    
    };
}

if( window.RTCSessionDescription ) {

    dVideo.RTC.SessionDescription = RTCSessionDescription;
    dVideo.RTC.IceCandidate = RTCIceCandidate;

}