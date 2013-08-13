/**
 * dAmnVideo extension for wsc.dAmn
 *
 * @module dVideo
 */
var dVideo = {};
dVideo.VERSION = '0.0.2';
dVideo.STATE = 'alpha';
dVideo.REVISION = '0.0.2';


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

dVideo.extension = function( client ) {
    
    if( !dVideo.RTC.PeerConnection )
        return;
    
    var init = function (  ) {
        
        client.bds.provides.push( 'PEER' );
        dVideo.create_phone( client );
        
        // Event bindings
        client.bind( 'BDS.PEER.REQUEST', function( event ) { dVideo.phone.signal.request( event ); } );
        client.bind( 'BDS.PEER.ACK', function( event ) { dVideo.phone.signal.ack( event ); } );
        client.bind( 'BDS.PEER.REJECT', function( event ) { dVideo.phone.signal.reject( event ); } );
        client.bind( 'BDS.PEER.ACCEPT', function( event ) { dVideo.phone.signal.accept( event ); } );
        client.bind( 'BDS.PEER.OPEN', function( event ) { dVideo.phone.signal.open( event ); } );
        client.bind( 'BDS.PEER.END', function( event ) { dVideo.phone.signal.end( event ); } );
        client.bind( 'BDS.PEER.OFFER', function( event ) { dVideo.phone.signal.offer( event ); } );
        client.bind( 'BDS.PEER.ANSWER', function( event ) { dVideo.phone.signal.answer( event ); } );
        client.bind( 'BDS.PEER.CLOSE', function( event ) { dVideo.phone.signal.close( event ); } );
        
        client.ui.control.add_button({
            label: '',
            icon: 'camera',
            title: 'Start a video call.',
            href: '#call',
            handler: function(  ) { 
                dVideo.create_phone( client );
                //dVideo.phone.something();
            }
        });
        
    };
    
    /**
     * Handle commands!
     */
    var cmds = {
        
    };
    
    
    /**
     * Handle events.
     */
    var handle = {
        
    };
    
    init();

};
/**
 * Create a new video phone.
 */
dVideo.create_phone = function( client ) {

    if( dVideo.phone )
        return;
    
    dVideo.phone = new dVideo.Phone( client );

};


/**
 * Video phone
 * 
 * @class dVideo.Phone
 * @constructor
 * @param client {Object} Reference to the wsc client
 * @since 0.0.0
 */
dVideo.Phone = function( client ) {

    // SET PROPERTIES
    this.call = null;
    this.client = client;
    this.stream = null;
    this.url = null;
    this.view = null;
    this.signal = {};
    
    this.build();

};

/**
 * Build the phone UI.
 *
 * @method build
 */
dVideo.Phone.prototype.build = function(  ) {

    this.client.ui.view.append('<div class="phone"></div>');
    this.view = this.client.ui.view.find('div.phone');

};


/**
 * Get the webcam and microphone streams.
 * 
 * @method get_media
 * @param [success] {Function} Callback to fire when we have the streams
 * @param [err] {Function} Callback to fire when there is an error
 */
dVideo.Phone.prototype.get_media = function( success, err ) {

    var stub = function(  ) {};
    success = success || stub;
    err = err || stub;
    
    dVideo.getUserMedia(
        { video: true, audio: true },
        function( stream ) {
            dVideo.phone.got_media( stream );
            success( stream );
        },
        function( error ) {
            err( error );
            console.log( error );
        }
    );

};

/**
 * What to do when we have the webcam stream.
 *
 * @method got_media
 * @param stream {Object} Webcam stream
 */
dVideo.Phone.prototype.got_media = function( stream ) {

    dVideo.phone.url = URL.createObjectURL( stream );
    dVideo.phone.stream = stream;

};


/**
 * Start or join a call.
 * @method dial
 * @param bds {String} dAmn channel being used for BDS commands
 * @param pns {String} Peer namespace for the call
 * @param [ns=bds] {String} dAmn channel for the call
 * @param [host=pns.user] {String} Host of the call
 * @return {Object} Reference to the current call
 */
dVideo.Phone.prototype.dial = function( bds, pns, ns, host ) {

    if( this.call != null )
        return this.call;
    
    ns = ns || bds;
    
    this.call = new dVideo.Phone.Call( this, bds, ns, pns, host );
    dVideo.signal.request(  );
    
    return this.call;

};

/**
 * Receive an incoming peer connection.
 * 
 * @method incoming
 * @param pns {String} Peer connection namespace
 * @param user {String} User of the connection
 * @param event {Object} Event data
 */
dVideo.Phone.prototype.incoming = function( pns, user, event ) {

    var client = this.client;
    
    if( this.call == null ) {
        
        var pnotice = client.ui.pager.notice({
            'ref': 'call-' + user,
            'icon': '<img src="' + wsc.dAmn.avatar.src(user,
                client.channel(event.ns).info.members[user].usericon) + '" />',
            'heading': user + ' calling...',
            'content': user + ' is calling you.',
            'buttons': {
                'answer': {
                    'ref': 'answer',
                    'target': 'answer',
                    'label': 'Answer',
                    'title': 'Answer the call',
                    'click': function(  ) {
                        client.ui.pager.remove_notice( pnotice );
                        dVideo.phone.answer( event.ns, event.param[2] || event.ns, pns, user );
                        return false;
                    }
                },
                'reject': {
                    'ref': 'reject',
                    'target': 'reject',
                    'label': 'Reject',
                    'title': 'Reject the call',
                    'click': function(  ) {
                        client.npmsg(event.ns, 'BDS:PEER:REJECT:'+pns+',' + user);
                        client.ui.pager.remove_notice( pnotice );
                        return false;
                    }
                }
            }
        }, true );
        
        pnotice.onclose = function(  ) {
            client.npmsg( event.ns, 'BDS:PEER:REJECT:' + event.user );
        };
    
        return;
    
    }
    
    var peer = this.call.new_peer( pns, user );
    var call = this.call;
    
    if( !peer ) {
        dVideo.signal.reject( user, 'Permission denied' );
        return;
    }
    
    /**
     * Usually we have this:
     * 
     *      <a> BDS:PEER:REQUEST:a,pchat:a:b
     *      <b> BDS:PEER:ACK:a,pchat:a:b
     *      <b> BDS:PEER:ACCEPT:pchat:a:b,a
     *      <a> BDS:PEER:OFFER:pchat:a:b,a,b,[offer]
     *      <b> BDS:PEER:ANSWER:pchat:a:b,b,a,[answer]
     *  
     * But for group calls we do this when the bot connects you to another
     * user in a group call:
     * 
     *      <bot> BDS:PEER:REQUEST:user,bdsc:botlab-meeting,chat:botlab
     *      <you> BDS:PEER:OFFER:bdsc:botlab-meeting,you,user,[offer]
     *      <bot> BDS:PEER:ANSWER:bdsc:botlab-meeting,user,you,[answer]
     *  
     * Similarly, the client should be able to respond to offers on the other
     * side of this, which will simply run as follows:
     * 
     *      <bot> BDS:PEER:OFFER:bdsc:botlab-meeting,you,user,[offer]
     *      <user> BDS:PEER:ANSWER:bdsc:botlab-meeting,user,you,[answer]
     *  
     *  Request is not needed on this side of things. Make it so.
     */
    
    if( !this.call.group ) {
        dVideo.signal.accept( user );
        return;
    }
    
    peer.conn.ready(
        function(  ) {
            dVideo.signal.offer( peer );
        }
    );

};

/**
 * Answer a call.
 * @method answer
 * @param bds {String} dAmn channel being used for bds messages
 * @param ns {String} dAmn channel associated with the call
 * @param pns {String} Peer namespace for the call
 * @param user {String} User for the call
 */
dVideo.Phone.prototype.answer = function( bds, ns, pns, user ) {

    this.call = new dVideo.Phone.Call( this, bds, ns, pns, user );
    
    var peer = this.call.new_peer( pns, user );
    
    if( !peer ) {
        dVideo.signal.reject( user, 'Permission denied' );
        this.call.close();
        this.call = null;
        return;
    }
    
    dVideo.signal.accept( user );

};
/**
 * Call object. Maybe a bit over the top here.
 * @class dVideo.Phone.Call
 * @constructor
 * @param phone {Object} Phone the call is being made on
 * @param bds {String} dAmn channel being used for bds messages
 * @param ns {String} dAmn channel the call is connected to
 * @param pns {String} Peer namespace the call is associated with
 * @param [user=pns.user] {String} User who started the call
 * @since 0.0.0
 */
dVideo.Phone.Call = function( phone, bds, ns, pns, user ) {

    this.phone = phone;
    this.bds = bds;
    this.pns = pns;
    this.ns = ns;
    this.user = '';
    this.peers = {};
    
    this.spns = this.pns.split('-');
    this.ans = this.spns.shift();
    this.rns = this.spns.join(' ');
    this.group = dVideo.bots.indexOf( this.ns.substr( 1 ) ) != -1;
    
    this.user = user || this.spns[0].substr(1);
    
    this.dans = phone.client.deform_ns( this.ans );
    
    dVideo.create_signaling_channel( this.phone.client, bds, pns, ns );
    
    dVideo.getUserMedia(
        { video: true, audio: true },
        function( stream ) {
            dVideo.phone.url = URL.createObjectURL( stream );
            dVideo.phone.stream = stream;
            console.log( 'got stream' );
        },
        function( err ) {
            console.log( err );
        }
    );

};

/**
 * Close the call.
 * @method close
 */
dVideo.Phone.Call.prototype.close = function(  ) {

    for( var p in this.peers ) {
    
        if( !this.peers.hasOwnProperty( p ) )
            continue;
        
        this.peers[p].conn.close();
    
    }

};

/**
 * Add a new peer to the call.
 * @method new_peer
 * @param pns {String} Peer namespace for the call
 * @param user {String} Name of the peer
 * @return {Object} New peer connection object or null if failed
 */
dVideo.Phone.Call.prototype.new_peer = function( pns, user ) {
    
    if( this.pns != pns )
        return null;
    
    if( !this.group ) {
    
        if( this.dans.substr(1).toLowerCase() != user.toLowerCase() )
            return null;
    
    }
    
    var peer = {
        user: user,
        conn: dVideo.peer_connection( user ),
        stream: null,
        url: null
    };
    
    this.peers[user] = peer;
    return peer;

};

/**
 * Get a peer.
 * @method peer
 * @param peer {String} Name of the peer
 * @return {Object} Peer connection object or null
 */
dVideo.Phone.Call.prototype.peer = function( peer ) {

    return this.peers[peer] || null;

};
/**
 * This object represents a signalling channel used for transmitting connection data
 * between two peers.
 *
 * @class dVideo.SignalChannel
 * @constructor
 * @param client {Object} An instance of wsc.
 * @param this.bds {String} dAmn channel used for this.bds commands
 * @param this.pns {String} Peer namespace associated with the signals
 * @param [ns] {String} Channel associated with the connection, if any
 * @since 0.0.0
 */
dVideo.SignalChannel = function( client, bds, pns, ns ) {
    
    this.user = client.settings.username;
    this.nse = ns ? ',' + ns : '';
    this.bds = this.bds;
    this.pns = this.pns;
    this.ns = ns;
    this.client = client;

};

/**
 * Request a peer connection with a particular this.user.
 * 
 * @method request
 */
dVideo.SignalChannel.prototype.request = function(  ) {

    this.client.npmsg( this.bds, 'BDS:PEER:REQUEST:' + this.user + ',' + this.pns + ',' + this.nse );

};

/**
 * Accept a peer connection request.
 * 
 * @method accept
 * @param auser {String} this.user to open a peer connection with
 */
dVideo.SignalChannel.prototype.accept = function( auser ) {

    this.client.npmsg( this.bds, 'BDS:PEER:ACCEPT:' + this.pns + ',' + auser + this.nse );

};

/**
 * Send a connection offer.
 * 
 * @method offer
 * @param peer {Object} WebRTC peer object
 */
dVideo.SignalChannel.prototype.offer = function( peer ) {

    this.client.npmsg( this.bds, 'BDS:PEER:OFFER:' + this.pns + ',' + this.user + ',' + peer.user + ',' + JSON.stringify( peer.conn.offer ) );

};

/**
 * Send a WebRTC peer answer to open a connection
 * 
 * @method answer
 * @param peer {Object} WebRTC peer object
 */
dVideo.SignalChannel.prototype.answer = function( peer ) {

    this.client.npmsg( this.bds, 'BDS:PEER:ANSWER:' + this.pns + ',' + this.user + ',' + peer.user + ',' + JSON.stringify( peer.conn.offer ) );

};


/**
 * Send a candidate
 * 
 * @method candidate
 * @param peer {Object} WebRTC peer object
 * @param candidate {Object} WebRTC candidate object
 */
dVideo.SignalChannel.prototype.candidate = function( peer, candidate ) {

    this.client.npmsg( this.bds, 'BDS:PEER:CANDIDATE:' + this.pns + ',' + this.user + ',' + peer.user + ',' + JSON.stringify( candidate ) );

};


/**
 * Reject a peer request
 * 
 * @method reject
 * @param ruser {String} Remote user to reject
 * @param [reason] {String} Reason for rejecting the request
 */
dVideo.SignalChannel.prototype.reject = function( ruser, reason ) {

    reason = reason ? ',' + reason : '';
    this.client.npmsg( this.bds, 'BDS:PEER:REJECT:' + this.pns + ',' + ruser + reason );

};


/**
 * Close a peer connection
 * 
 * @method close
 * @param cuser {String} User to close the connection for
 */
dVideo.SignalChannel.prototype.close = function( cuser ) {

    this.client.npmsg( this.bds, 'BDS:PEER:CLOSE:' + this.pns + ',' + ( cuser || this.user ) );

};


/**
 * Request a list of available connections
 * 
 * @method list
 * @param [channel] {String} Find connections associated with this channel
 */
dVideo.SignalChannel.prototype.list = function( channel ) {

    channel = channel ? ':' + channel : '';
    this.client.npmsg( this.bds, 'BDS:PEER:LIST' + channel );

};


// EVENT HANDLERS

/**
 * Handle a peer request
 * 
 * @method on_request
 * @param event {Object} Event data
 */
dVideo.SignalChannel.prototype.on_request = function( event ) {
    
    if( event.sns[0] != '@' )
        return;
    
    var user = event.param[0];
    var pns = event.param[1];
    
    // Away or ignored
    if( this.client.ui.umuted.indexOf( user.toLowerCase() ) != -1 ) {
        this.client.npmsg(event.ns, 'BDS:PEER:REJECT:' + pns + ',' + user + ',You have been blocked');
        return false;
    }
    
    if( this.client.away.on ) {
        this.client.npmsg(event.ns, 'BDS:PEER:REJECT:'+pns+','+user+',Away; ' + client.away.reason);
        return false;
    }
    
    if( phone.call != null ) {
        if( !phone.call.group ) {
            this.client.npmsg( event.ns, 'BDS:PEER:REJECT:' + pns + ',' + user + ',Already in a call' );
            return false;
        }
    }
    
    this.client.npmsg(event.ns, 'BDS:PEER:ACK:' + pns + ',' + user);
    
    // Tell the user about the call.
    return true;

},

/**
 * Handle an ack
 * Don't really need to do anything here
 * Unless we set a timeout for requests
 * 
 * @method on_ack
 * @param event {Object} Event data
 */
dVideo.SignalChannel.prototype.on_ack = function( event ) {};


/**
 * handle a reject
 * 
 * @method on_reject
 * @param event {Object} Event data
 */
dVideo.SignalChannel.prototype.on_reject = function( event ) {
    
    if( event.sns[0] != '@' )
        return;
    
    // dVideo.phone.call.close();
    // dVideo.phone.call = null;

};


/**
 * Handle an accept
 *
 * @method on_accept
 * @param event {Object} Event data
 */
dVideo.SignalChannel.prototype.on_accept = function( event ) {
    
    if( event.sns[0] != '@' )
        return;
    
    if( !phone.call )
        return;
    
    var call = dVideo.phone.call;
    var pns = event.param[0];
    var user = event.param[1];
    var chan = event.param[2] || event.ns;
    
    if( user.toLowerCase() != client.settings.username.toLowerCase() )
        return;
    
    var peer = phone.call.new_peer( pns, event.user );
    
    if( !peer ) {
        return;
    }
    
    peer.conn.ready(
        function(  ) {
            dVideo.signal.offer( peer );
        }
    );

};


dVideo.SignalChannel.prototype.on_open = function( event ) {};

dVideo.SignalChannel.prototype.on_end = function( event ) {};


/**
 * Handle an offer
 * 
 * @method on_offer
 * @param event {Object} Event data
 */
dVideo.SignalChannel.prototype.on_offer = function( event ) {
    
    if( event.sns[0] != '@' )
        return;
    
    if( !phone.call )
        return;
    
    var call = phone.call;
    var pns = event.param[0];
    var user = event.param[1];
    var target = event.param[2];
    var offer = new dVideo.RTC.SessionDescription( JSON.parse( event.param.slice(3).join(',') ) );
    
    if( target.toLowerCase() != client.settings.username.toLowerCase() )
        return;
    
    // Away or ignored
    if( client.ui.umuted.indexOf( user.toLowerCase() ) != -1 ) {
        dVideo.signal.reject( user, 'You have been blocked' );
        return;
    }
    
    if( client.away.on ) {
        dVideo.signal.reject( user, 'Away, reason: ' + client.away.reason );
        return;
    }
    
    var peer = call.peer( user );
    
    if( !peer ) {
        if( !call.group )
            return;
        
        peer = call.new_peer( pns, user );
    }
    
    peer.conn.ready(
        function(  ) {
            dVideo.signal.answer( peer );
            console.log('new peer',peer.user);
        },
        offer
    );

};

/**
 * Handle an answer
 * 
 * @method on_answer
 * @param event {Object} Event data
 */
dVideo.SignalChannel.prototype.on_answer = function( event ) {
    
    if( event.sns[0] != '@' )
        return;
    
    if( !phone.call )
        return;
    
    var call = phone.call;
    var pns = event.param[0];
    var user = event.param[1];
    var target = event.param[2];
    var offer = new dVideo.RTC.SessionDescription( JSON.parse( event.param.slice(3).join(',') ) );
    
    if( target.toLowerCase() != client.settings.username.toLowerCase() )
        return;
    
    var peer = call.peer( user );
    
    if( !peer )
        return;
    
    peer.conn.open(
        function(  ) {
            console.log('> connected to new peer ' + peer.user);
        },
        offer
    );

};


/**
 * Handle a candidate
 * 
 * @method on_candidate
 * @param event {Object} Event data
 */
dVideo.SignalChannel.prototype.on_candidate = function( event ) {
    
    if( event.sns[0] != '@' )
        return;
    
    if( !phone.call )
        return;
    
    var call = phone.call;
    var pns = event.param[0];
    var user = event.param[1];
    var target = event.param[2];
    var candidate = new dVideo.RTC.SessionDescription( JSON.parse( event.param.slice(3).join(',') ) );
    
    if( target.toLowerCase() != client.settings.username.toLowerCase() )
        return;
    
    var peer = call.peer( user );
    
    if( !peer )
        return;
    
    peer.conn.candidate( candidate );

};


/**
 * Handle a close command
 *
 * @method on_close
 * @param event {Object} Event data
 */
dVideo.SignalChannel.prototype.on_close = function( event ) {};
/**
 * lol
 *
 * Make a peer connection.
 */
dVideo.peer_connection = function( user, remote ) {

    if( !dVideo.RTC.PeerConnection )
        return null;
    
    return new dVideo.PeerConnection( user, remote );

};


/**
 * Our own wrapper for RTCPeerConnection objects.
 * 
 * Because boilerplate? Yeah, that.
 *
 * @class dVideo.PeerConnection
 * @constructor
 * @param user {String} User the connection is associated with
 * @param [remote_offer=null] {String} Descriptor for a remote offer.
 * @since 0.0.0
 */
dVideo.PeerConnection = function( user, remote_offer ) {

    this.user = user;
    this.pc = new dVideo.RTC.PeerConnection( dVideo.peer_options );
    this.offer = '';
    this.remote_offer = remote_offer || null;
    this.responding = this.remote_offer != null;
    this.streamed = false;
    
    this.bindings();
    
    if( this.remote_offer )
        this.set_remote_description( this.remote_offer );

};

/**
 * Set up event bindings for the peer connection.
 * @method bindings
 */
dVideo.PeerConnection.prototype.bindings = function(  ) {

    var pc = this;
    var user = this.user;
    
    // For those things that still do things in ice candidate mode or whatever.
    this.pc.onicecandidate = function( candidate ) {
        dVideo.signal.candidate( dVideo.phone.call.peer( user ), candidate );
    };
    
    // Stub event handler
    var stub = function() {};
    this.onready = stub;
    this.onopen = stub;

};

/**
 * Ready the connection.
 * 
 * Callback fired when the connection is ready to be opened. IE, when a local
 * offer is set. Signalling channels should be used to transfer offer information.
 * 
 * If a remote offer is provided, then the object generates an answer for the
 * offer.
 * 
 * @method ready
 * @param onready {Function} Callback to fire when the connection is ready
 * @param [remote=null] {String} Descriptor for a remote offer
 */
dVideo.PeerConnection.prototype.ready = function( onready, remote ) {

    this.onready = onready || this.onready;
    this.remote_offer = remote || this.remote_offer;
    this.responding = this.remote_offer != null;
    
    if( this.responding ) {
        var onopen = this.onopen;
        var pc = this;
        
        this.onopen = function( ) {
        
            pc.answer();
            pc.onopen = onopen;
        
        };
        
        this.set_remote_description( this.remote_offer );
        return;
    }
    
    this.create_offer();

};

/**
 * Open a connection to a remote peer.
 *
 * @method open
 * @param onopen {Function} Callback to fire when the connection is open
 * @param [offer=null] {String} Descriptor for the remote connection
 */
dVideo.PeerConnection.prototype.open = function( onopen, offer ) {

    if( !this.offer )
        return;
    
    this.remote_offer = offer || this.remote_offer;
    this.onopen = onopen;
    
    if( !this.remote_offer )
        return;
    
    this.set_remote_description( this.remote_offer );

};

/**
 * Close a connection
 * @method close
 */
dVideo.PeerConnection.prototype.close = function(  ) {

    this.pc.close();

};

/**
 * Method usually called on errors.
 * @method onerror
 */
dVideo.PeerConnection.prototype.onerror = function( err ) {

    console.log( '>> Got an error:', '"', err.message, '"', err );

};

/**
 * Add an Ice Candidate to the peer connection.
 * 
 * @method candidate
 * @param candidate {Object} Ice Candidate
 */
dVideo.PeerConnection.prototype.candidate = function( candidate ) {

    this.pc.addIceCandidate( candidate );

};

/**
 * Create an offer for a connection.
 *
 * Helper method.
 * @method create_offer
 */
dVideo.PeerConnection.prototype.create_offer = function(  ) {

    var pc = this;
    
    this.pc.createOffer(
        function( description ) { pc.offer_created( description ); },
        function( err ) { pc.onerror( err ); }
    );

};

/**
 * An offer has been created! Set it as our local description.
 * @method offer_created
 * @param description {String} Descriptor for the offer.
 */
dVideo.PeerConnection.prototype.offer_created = function( description ) {

    this.offer = description;
    var pc = this;
    
    this.pc.setLocalDescription( this.offer , function(  ) { pc.local_description_set(); }, this.onerror );

};

/**
 * Set the descriptor for the remote connection.
 * @method set_remote_description
 * @param description {String} Descriptor for the remote connection
 */
dVideo.PeerConnection.prototype.set_remote_description = function( description ) {

    this.remote_offer = description;
    var pc = this;
    
    this.pc.setRemoteDescription( this.remote_offer , function(  ) { pc.remote_description_set(); }, this.onerror );

};

/**
 * A local description as been set. Handle it!
 * @method local_description_set
 */
dVideo.PeerConnection.prototype.local_description_set = function(  ) {

    this.onready();

};

/**
 * A local description as been set. Handle it!
 * @method remote_description_set
 */
dVideo.PeerConnection.prototype.remote_description_set = function(  ) {

    this.onopen();

};

/**
 * Create an answer for a remote offer.
 * @method answer
 */
dVideo.PeerConnection.prototype.answer = function(  ) {

    var pc = this;
    this.responding = true;
    
    this.pc.createAnswer( 
        function( answer ) { pc.answer_created( answer ); },
        function( err ) { pc.onerror( err ); }
    );

};

/**
 * Answer has been created. Send away, or something.
 * @method answer_created
 * @param answer {String} Descriptor for answer.
 */
dVideo.PeerConnection.prototype.answer_created = function( answer ) {

    this.offer = answer;
    var pc = this;
    
    this.pc.setLocalDescription( this.offer,
        function(  ) { pc.local_description_set(); },
        function( err ) { pc.onerror( err ); }
    );

};