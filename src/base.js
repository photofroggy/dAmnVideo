/**
 * dAmnVideo extension for wsc.dAmn
 *
 * @module dVideo
 */
var dVideo = {};
dVideo.VERSION = '0.0.3';
dVideo.STATE = 'alpha';
dVideo.REVISION = '0.0.3';
dVideo.APPNAME = 'dAmnVideo 0';


/**
 * Array containing bots used to manage calls.
 * 
 * TODO: change things so that instead of using this, the extension recognises bots in
 * the privilege class ServiceBots. If implementing things so that normal bots can
 * declare themselves as service bots for specific channels, then take that into account
 * as well, though that would probably be done in wsc, not here.
 */
dVideo.bots = [ 'botdom', 'damnphone' ];


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


/**
 * Signaling channel object
 */
dVideo.signal = null;


/**
 * Object detailing the local peer.
 */
dVideo.local = {};
dVideo.local.stream = null;
dVideo.local.url = null;

/**
 * Objects detailing remote peers.
 */
dVideo.remote = {};
dVideo.remote._empty = {
    video: null,
    audio: null,
    conn: null
};


/**
 * Current channel stuff.
 */
dVideo.chan = {};
dVideo.chan.group = false;
dVideo.chan.calls = [];

