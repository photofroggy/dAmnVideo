/**
 * dAmnVideo extension for wsc.dAmn
 *
 * @module dVideo
 */
var dVideo = {};
dVideo.VERSION = '1.0.13';
dVideo.STATE = 'beta';
dVideo.REVISION = '0.7.13';
dVideo.APPNAME = 'dAmnVideo';
dVideo.APPVERSION = 1;


/**
 * Options for peer candidates.
 */
dVideo.peer_options = {
    iceServers: [
        { url: 'stun:stun.l.google.com:19302' }
    ]
};


/**
 * Holds a reference to the phone.
 */
dVideo.phone = null;

