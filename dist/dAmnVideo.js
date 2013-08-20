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
        client.bind( 'peer.request', function( event ) { dVideo.phone.signal.request( event ); } );
        //client.bind( 'BDS.PEER.ACK', function( event ) { dVideo.phone.signal.ack( event ); } );
        //client.bind( 'BDS.PEER.REJECT', function( event ) { dVideo.phone.signal.reject( event ); } );
        client.bind( 'peer.accept', function( event ) { dVideo.phone.signal.accept( event ); } );
        //client.bind( 'BDS.PEER.OPEN', function( event ) { dVideo.phone.signal.open( event ); } );
        //client.bind( 'BDS.PEER.END', function( event ) { dVideo.phone.signal.end( event ); } );
        //client.bind( 'peer.offer', function( event ) { dVideo.phone.signal.offer( event ); } );
        //client.bind( 'peer.answer', function( event ) { dVideo.phone.signal.answer( event ); } );
        client.bind( 'peer.close', function( event ) { dVideo.phone.signal.close( event ); } );
        
        client.ui.control.add_button({
            label: '',
            icon: 'camera',
            title: 'Start a video call.',
            href: '#call',
            handler: function(  ) { 
                var cui = client.ui.chatbook.current;
                
                if( cui.namespace[0] != '@' )
                    return;
                
                var ns = cui.raw;
                var user = cui.namespace.substr(1);
                var title = 'private-call';
                var pns = ns + ':' + title;
                
                var call = client.bds.peer.open( ns, pns, user, dVideo.APPNAME );
                
                var done = function(  ) {
                    call.signal.request( );
                };
                
                dVideo.phone.get_media(
                    function(  ) {
                        // Set as the local stream on the call
                        // and set up a view port.
                        call.localstream = dVideo.phone.stream;
                        // TODO: set up viewport
                    }, done
                );
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
    
    this.signal = new dVideo.SignalHandler( this, this.cient );

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
    
    this.client.ui.get_user_media(
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
    
    this.signal = new dVideo.SignalChannel( this.phone.client, bds, pns, ns );
    
    if( this.phone.stream == null ) {
        this.phone.get_media();
    }

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
 * Send a command for the current signal channel.
 * 
 * @method command
 * @param command {String} Command to send
 * @param [arg1..n] {String} Arguments
 */
dVideo.SignalChannel.prototype.command = function(  ) {

    var args = Array.prototype.slice.call(arguments);
    var command = args.shift();
    
    //args.unshift( this.pns );
    var arg = this.pns;
    
    for( var i = 0; i < args.length; i++ ) {
        if( !args[i] )
            continue;
        arg+= ',' + args[i];
    }
    
    this.client.npmsg( this.bds, 'BDS:PEER:' + command + ':' + arg );

};

/**
 * Request a peer connection with a particular user.
 * 
 * @method request
 */
dVideo.SignalChannel.prototype.request = function(  ) {

    this.command( 'REQUEST', this.user, 'webcam' );

};

/**
 * Accept a peer connection request.
 * 
 * @method accept
 * @param auser {String} user to open a peer connection with
 */
dVideo.SignalChannel.prototype.accept = function( auser ) {

    this.command( 'ACCEPT', auser, this.nse );

};

/**
 * Send a connection offer.
 * 
 * @method offer
 * @param peer {Object} WebRTC peer object
 */
dVideo.SignalChannel.prototype.offer = function( peer ) {

    this.command( 'OFFER', this.user, peer.user, JSON.stringify( peer.conn.offer ) );

};

/**
 * Send a WebRTC peer answer to open a connection
 * 
 * @method answer
 * @param peer {Object} WebRTC peer object
 */
dVideo.SignalChannel.prototype.answer = function( peer ) {

    this.command( 'ANSWER', this.user, peer.user, JSON.stringify( peer.conn.offer ) );

};


/**
 * Send a candidate
 * 
 * @method candidate
 * @param peer {Object} WebRTC peer object
 * @param candidate {Object} WebRTC candidate object
 */
dVideo.SignalChannel.prototype.candidate = function( peer, candidate ) {

    this.command( 'CANDIDATE', this.user, peer.user, JSON.stringify( candidate ) );

};


/**
 * Reject a peer request
 * 
 * @method reject
 * @param ruser {String} Remote user to reject
 * @param [reason] {String} Reason for rejecting the request
 */
dVideo.SignalChannel.prototype.reject = function( ruser, reason ) {

    this.command( 'REJECT', ruser, reason );

};


/**
 * Close a peer connection
 * 
 * @method close
 * @param cuser {String} User to close the connection for
 */
dVideo.SignalChannel.prototype.close = function( cuser ) {

    this.command( 'CLOSE', ( cuser || this.user ) );

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
/**
 * Signal handling class.
 *
 * Provides a collection of event handlers which allow the extension to respond to
 * appropriate BDS commands.
 *
 * @class dVideo.SignalHandler
 * @constructor
 * @param phone {Object} Reference to the phone object
 * @param client {Object} Reference to a wsc instance
 */
dVideo.SignalHandler = function( phone, client ) {

    this.phone = phone;
    this.client = client;

};


// EVENT HANDLERS

/**
 * Handle a peer request
 * 
 * @method request
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.request = function( event ) {
    
    if( dVideo.APPNAME != event.call.app )
        return;
    
    var call = event.call;
    var peer = event.peer;
    
    /*
    // Away or ignored
    if( this.client.ui.umuted.indexOf( user.toLowerCase() ) != -1 ) {
        event.call.signal.reject( user, 'You have been blocked' );
        return false;
    }
    console.log('bitch');
    if( this.client.away.on ) {
        event.call.signal.reject( user, 'Away; ' + client.away.reason );
        return false;
    }
    */
    /*
    if( phone.call != null ) {
        if( !phone.call.group ) {
            this.client.npmsg( event.ns, 'BDS:PEER:REJECT:' + pns + ',' + user + ',Already in a call' );
            return false;
        }
    }*/
    peer.onicecompleted = function(  ) {
        console.log('> finished ice.');
    };
    
    console.log('requested',peer.pc.signalingState);
    peer.onremotedescription = function(  ) {
        console.log( '> got offer from',peer.user,', answering');
        peer.create_answer();
    };

    peer.onlocaldescription = function(  ) {
        console.log('> got answer for',peer.user,', sending');
        call.signal.answer( peer );
    };
    
    // TODO: Tell the user about the call.
    event.call.signal.accept( event.user, event.app );
    

},

/**
 * Handle an ack
 * Don't really need to do anything here
 * Unless we set a timeout for requests
 * 
 * @method ack
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.ack = function( event ) {};


/**
 * handle a reject
 * 
 * @method reject
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.reject = function( event ) {

    // dVideo.phone.call.close();
    // dVideo.phone.call = null;

};


/**
 * Handle an accept
 *
 * @method accept
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.accept = function( event ) {
    
    
    if( dVideo.APPNAME != event.call.app )
        return;
    
    var call = event.call;
    var peer = event.peer;
    
    // Set event callbacks.
    peer.onicecompleted = function(  ) {
        console.log('> finished ice.');
    };
    
    peer.onlocaldescription = function(  ) {
        console.log('> created offer for',peer.user);
        call.signal.offer( peer );
    };
    
    peer.onremotedescription = function(  ) {
        // We have our answer here, so everything should be fine and dandy.
        console.log('> retrieved answer and connected', peer.user);
        peer.persist();
    };
    
    peer.create_offer();

};


dVideo.SignalHandler.prototype.open = function( event ) {};

dVideo.SignalHandler.prototype.end = function( event ) {};


/**
 * Handle an offer
 * 
 * @method offer
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.offer = function( event ) {
    
    
    if( dVideo.APPNAME != event.call.app )
        return;
    
    var call = event.call;
    var peer = event.peer;
    var offer = event.offer;
    /*
    // Away or ignored
    if( this.client.ui.umuted.indexOf( user.toLowerCase() ) != -1 ) {
        call.signal.reject( user, 'You have been blocked' );
        return;
    }
    
    if( this.client.away.on ) {
        call.signal.reject( user, 'Away, reason: ' + this.client.away.reason );
        return;
    }*/
    
    peer.onremotedescription = function( ) {
        peer.answer();
    };
    
    peer.ready(
        function(  ) {
            call.signal.answer( peer );
            console.log('> connected to new peer', peer.user);
        },
        offer
    );

};

/**
 * Handle an answer
 * 
 * @method answer
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.answer = function( event ) {
    
    if( dVideo.APPNAME != event.call.app )
        return;
    
    var call = event.call;
    var peer = event.peer;
    
    var peer = call.peer( peer.user );
    
    if( !peer )
        return;
    
    peer.open(
        function(  ) {
            console.log('> connected to new peer ', peer.user);
        },
        event.answer
    );

};


/**
 * Handle a candidate
 * 
 * @method candidate
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.candidate = function( event ) {
    
    var call = phone.call;
    var pns = event.param[0];
    var user = event.param[1];
    var target = event.param[2];
    console.log(event.param.slice(3));
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
 * @method close
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.close = function( event ) {};/**
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
    this.remote_stream = null;
    this.stream = null;
    
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
    
    // Do something when a remote stream arrives.
    this.pc.onaddstream = function( event ) {
        pc.set_remote_stream( event );
    };
    
    // Stub event handler
    var stub = function() {};
    this.onready = stub;
    this.onopen = stub;
    this.onremotestream = stub;
    this.onlocalstream = stub;

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

/**
 * Do something with the remote stream when it arrives.
 * 
 * @method set_remote_stream
 * @param event {Object} Event data
 */
dVideo.PeerConnection.prototype.set_remote_stream = function( event ) {

    this.remote_stream = event.stream;
    this.onremotestream();

};

/**
 * Store the local media stream and add it to the peer connection.
 * 
 * @method set_local_stream
 * @param stream {Object} Local media stream
 */
dVideo.PeerConnection.prototype.set_remote_stream = function( stream ) {

    this.pc.addStream( stream );
    this.stream = stream;
    this.onlocalstream();

};