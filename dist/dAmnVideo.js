/**
 * dAmnVideo extension for wsc.dAmn
 *
 * @module dVideo
 */
var dVideo = {};
dVideo.VERSION = '0.5.11';
dVideo.STATE = 'alpha';
dVideo.REVISION = '0.5.11';
dVideo.APPNAME = 'dAmnVideo';
dVideo.APPVERSION = 1;


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



dVideo.extension = function( client ) {
    
    if( !wsc.dAmn.BDS.Peer.RTC.PeerConnection )
        return;
    
    var init = function (  ) {
        
        client.bds.provides.push( 'PEER' );
        dVideo.create_phone( client );
        
        
        // PEER events
        client.bind( 'peer.request', function( event ) { dVideo.phone.signal.request( event ); } );
        //client.bind( 'BDS.PEER.ACK', function( event ) { dVideo.phone.signal.ack( event ); } );
        //client.bind( 'BDS.PEER.REJECT', function( event ) { dVideo.phone.signal.reject( event ); } );
        client.bind( 'peer.accept', function( event ) { dVideo.phone.signal.accept( event ); } );
        //client.bind( 'BDS.PEER.OPEN', function( event ) { dVideo.phone.signal.open( event ); } );
        //client.bind( 'BDS.PEER.END', function( event ) { dVideo.phone.signal.end( event ); } );
        //client.bind( 'peer.offer', function( event ) { dVideo.phone.signal.offer( event ); } );
        //client.bind( 'peer.answer', function( event ) { dVideo.phone.signal.answer( event ); } );
        client.bind( 'peer.close', function( event ) { dVideo.phone.signal.close( event ); } );
        
        
        // Assorted dAmn events
        client.bind( 'pkt.recv_part', function( event ) { handle.recv_part( event ); } );
        
        
        client.ui.control.add_button({
            label: '',
            icon: 'iphone',
            title: 'Start a video call.',
            href: '#call',
            handler: function(  ) {
                var cui = client.ui.chatbook.current;
                
                // We should do something else if it is a public channel.
                if( cui.namespace[0] == '#' ) {
                    // Need stuff in here...
                    alert( 'Group calls not implemented yet! If you want group calls, let photofroggy know.' );
                    return;
                }
                
                var ns = cui.raw;
                var user = cui.namespace.substr(1);
                var title = 'Private Call';
                
                if( client.channel( ns ).get_usernames(  ).indexOf( user ) == -1 ) {
                    alert( 'Other user must be in the channel before calling.' );
                    return;
                }
                                
                dVideo.phone.dial( ns, ns + ':' + title, cui.namespace, title, user );
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
        
        recv_part: function( event ) {
        
            var call = dVideo.phone.call;
            
            if( !call )
                return;
            
            if( event.ns != call.ns )
                return;
            
            dVideo.phone.hangup( call );
        
        }
        
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
    
    this.signal = new dVideo.SignalHandler( this, this.client );

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

    this.url = URL.createObjectURL( stream );
    this.stream = stream;

};


/**
 * Start or join a call.
 * @method dial
 * @param bds {String} dAmn channel being used for BDS commands
 * @param pns {String} Peer namespace for the call
 * @param [user] {String} User for the call
 * @return {Object} Reference to the current call
 */
dVideo.Phone.prototype.dial = function( bds, pns, ns, title, user ) {

    if( this.call != null )
        return this.call;
    
    if( ns[0] != '@' )
        return;
                
    var call = client.bds.peer.open( bds, pns, user, dVideo.APPNAME, dVideo.APPVERSION );
    var peer = call.new_peer( user );
    
    
    call.onclose = function(  ) {
    
        dVideo.phone.call = null;
        client.ui.chatbook.channel( call.ns ).server_message( 'Call Ended' );
    
    };
    
    peer.onclose = function(  ) {
    
        console.log('> peer connection closed.' );
        call.close();
    
    };
    
    
    var done = function(  ) {
        call.signal.request( );
    };
    
    this.viewport( call, peer );
    
    this.get_media(
        function(  ) {
            // Set as the local stream on the call
            // and set up a view port.
            call.set_local_stream( dVideo.phone.stream );
            peer.set_local_stream( dVideo.phone.stream );
            // TODO: set up viewport
            done();
        }, done
    );
    
    this.call = call;
    
    return call;

};

/**
 * Receive an incoming peer connection.
 * 
 * @method incoming
 * @param call {Object} Incoming call
 * @param peer {Object} Peer making the request
 */
dVideo.Phone.prototype.incoming = function( call, peer ) {

    var client = this.client;
    var pnotice = null;
    
    if( this.call == null ) {
        
        pnotice = client.ui.pager.notice({
            'ref': 'call-' + peer.user,
            'icon': '<img src="' + wsc.dAmn.avatar.src(peer.user,
                client.channel(call.ns).info.members[peer.user].usericon) + '" />',
            'heading': 'Incoming Call',
            'content': peer.user + ' is calling you.',
            'buttons': {
                'answer': {
                    'ref': 'answer',
                    'target': 'answer',
                    'label': 'Answer',
                    'title': 'Answer the call',
                    'click': function(  ) {
                        client.ui.pager.remove_notice( pnotice );
                        dVideo.phone.answer( call, peer );
                        return false;
                    }
                },
                'reject': {
                    'ref': 'reject',
                    'target': 'reject',
                    'label': 'Reject',
                    'title': 'Reject the call',
                    'click': function(  ) {
                        call.signal.reject( peer.user );
                        client.ui.pager.remove_notice( pnotice );
                        return false;
                    }
                }
            }
        }, true );
        
        pnotice.onclose = function(  ) {
            call.signal.reject( peer.user );
            pnotice = null;
        };
        
        peer.onclose = function(  ) {
    
            console.log('> close',peer);
            dVideo.phone.hangup( call, peer );
            
            if( !pnotice )
                return;
            
            client.ui.pager.remove_notice( pnotice );
        
        };
        
        call.onclose = function(  ) {
            
            dVideo.phone.call = null;
            client.ui.chatbook.channel( call.ns ).server_message( 'Call Ended' );
    
        };
    
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
    
    if( !this.call.group )
        return;
    
    // Set event callbacks.
    peer.onicecompleted = function(  ) {
        console.log('> finished ice.');
    };
    
    peer.onlocaldescription = function(  ) {
        call.signal.offer( peer );
    };
    
    peer.onremotedescription = function(  ) {
        client.ui.chatbook.channel( call.ns ).server_message( 'Call Started' );
        peer.persist();
    };
    
    peer.onclose = function(  ) {
    
        console.log('> close',peer);
        dVideo.phone.hangup( call, peer );
        
        if( !pnotice )
            return;
        
        client.ui.pager.remove_notice( pnotice );
    
    };
    
    call.onclose = function(  ) {
    
        dVideo.phone.call = null;
        client.ui.chatbook.channel( call.ns ).server_message( 'Call Ended' );
    
    };
    
    peer.create_offer();

};

/**
 * Answer a call.
 * @method answer
 * @param call {Object} Incoming call
 * @param peer {Object} Peer making the request
 */
dVideo.Phone.prototype.answer = function( call, peer ) {

    this.call = call;
    
    if( call.group )
        return;
    
    var done = function(  ) {
        if( call.localstream )
            peer.set_local_stream( call.localstream );
        
        call.signal.accept( peer.user );
    };
    
    this.viewport( call, peer );
    
    this.get_media(
        function(  ) {
            // Set as the local stream on the call
            // and set up a view port.
            call.set_local_stream( dVideo.phone.stream );
            peer.set_local_stream( dVideo.phone.stream );
            // TODO: set up viewport
            done();
        }, done
    );

};


/**
 * Build viewports for webcams for a private call.
 * 
 * @method viewport
 */
dVideo.Phone.prototype.viewport = function( call, peer ) {

    var cui = this.client.ui.chatbook.channel( call.ns );
    cui.ulbuf+= 250;
    cui.resize();
    
    var height = cui.el.l.p.height();
    
    cui.el.l.p.after(
        '<div class="phone private">\
            <div class="title">\
                <h2>' + call.title + '</h2>\
            </div>\
            <div class="viewport remote">\
                <div class="video">\
                    <video autoplay></video>\
                </div>\
                <div class="label">\
                    <span class="label">' + peer.user + '</span>\
                    <ul class="control">\
                        <li><a href="#pause" title="Pause webcam" class="toggle pause remote">Pause</a></li>\
                        <li><a href="#mute" title="Mute webcam" class="toggle mute remote">Mute</a></li>\
                    </ul>\
                </div>\
            </div>\
            <div class="viewport local">\
                <div class="video">\
                    <video autoplay muted></video>\
                </div>\
                <div class="label">\
                    <span class="label">You</span>\
                    <ul class="control">\
                        <li><a href="#pause" title="Pause your webcam" class="toggle pause">Pause</a></li>\
                        <li><a href="#mute" title="Mute your microphone" class="toggle mute">Mute</a></li>\
                    </ul>\
                </div>\
            </div>\
            <div class="control">\
                <ul>\
                    <li><a href="#hangup" title="End the call" class="button hangup">Hang Up</a></li>\
                </u>\
            </div>\
        </div>'
    );
    
    var pui = cui.el.m.find( 'div.phone' );
    pui.height( height );
    
    pui.find('.control .hangup').click(
        function(  ) {
            dVideo.phone.hangup( call, peer );
            return false;
        }
    );
    
    var rvid = pui.find('.viewport.remote video');
    var lvid = pui.find('.viewport.local video');
    
    if( this.url )
        lvid[0].src = this.url;

    var toggle_logic = function( options ) {
        
        options = Object.extend( {
            mic: false,
            text: {
                pause: 'Play',
                play: 'Pause'
            }
        }, ( options || {} ) );
    
        return function(  ) {
            var button = pui.find( this );
            var remote = button.hasClass('remote');
        
            if( button.hasClass( 'paused' ) ) {
                play( options.mic, remote );
                button.text( options.text.play );
                button.removeClass( 'paused' );
                return false;
            }
        
            pause( options.mic, remote );
            button.text( options.text.pause );
            button.addClass( 'paused' );
            return false;
        };
    }
    
    pui.find( '.label .control .toggle.pause' ).click( toggle_logic() );
    pui.find( '.label .control .toggle.mute' ).click(
        toggle_logic({
            mic: true,
            text: {
                pause: 'Unmute',
                play: 'Mute'
            }
        })
    );
    
    var pause = function( mic, remote ) {
    
        var tracks = [];
        var l = 0;
        
        if( mic ) {
            if( remote )
                tracks = peer.remotemic;
            else
                tracks = call.localmic;
        } else {
            if( remote )
                tracks = peer.remotevideo;
            else
                tracks = call.localvideo;
        }
        
        l = tracks.length;
        
        if( l == 0 )
            return;
        
        for( var i = 0; i < l; i++ ) {
            tracks[ i ].enabled = false;
        };
    
    };
    
    var play = function( mic, remote ) {
    
        var tracks = [];
        var l = 0;
        
        if( mic ) {
            if( remote )
                tracks = peer.remotemic;
            else
                tracks = call.localmic;
        } else {
            if( remote )
                tracks = peer.remotevideo;
            else
                tracks = call.localvideo;
        }
        
        l = tracks.length;
        
        if( l == 0 )
            return;
        
        for( var i = 0; i < l; i++ ) {
            tracks[ i ].enabled = true;
        };
    
    };
    
    call.localmic = [];
    call.localvideo = [];
    
    call.onlocalstream = function(  ) {
        lvid[0].src = call.localurl;
        call.localmic = call.localstream.getAudioTracks();
        call.localvideo = call.localstream.getVideoTracks();
    };
    
    peer.vp = rvid[0];
    peer.remotemic = [];
    peer.remotevideo = [];
    
    peer.onremotestream = function(  ) {
        rvid[0].src = URL.createObjectURL( peer.remote_stream );
        peer.remotemic = peer.remote_stream.getAudioTracks();
        peer.remotevideo = peer.remote_stream.getVideoTracks();
        console.log( rvid[0].src );
    
    };
    

};


/**
 * Close a call.
 * 
 * @method hangup
 * @param call {Object} Call to close
 * @param peer {Object} Peer for the call
 */
dVideo.Phone.prototype.hangup = function( call, peer ) {

    this.destroy_call( call );
    
    if( call.group ) {
        // Need to actually do stuff here at some point.
        return;
    }
    
    call.close();

};


/**
 * Remove the viewport and streams.
 * 
 * @method destroy_call
 * @param call {Object} Call to destroy
 */
dVideo.Phone.prototype.destroy_call = function( call ) {

    if( call != this.call )
        return;
    
    if( call.localstream )
        call.localstream.stop();
    
    this.client.bds.peer.remove( call.pns );
    
    var cui = this.client.ui.chatbook.channel( call.ns );
    
    cui.el.m.find('div.phone').remove();
    cui.ulbuf-= 250;
    cui.resize();
    
    this.call = null;

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
    
    if( dVideo.APPNAME != event.call.app && event.call.app_ver >= dVideo.APPVERSION )
        return;
    
    var call = event.call;
    var peer = event.peer;
    var phone = dVideo.phone;
    
    // Away or ignored
    if( this.client.ui.umuted.indexOf( peer.user.toLowerCase() ) != -1 ) {
        call.signal.reject( peer.user, 'You have been blocked' );
        return false;
    }
    
    if( this.client.away.on ) {
        call.signal.reject( peer.user, 'Away; ' + client.away.reason );
        return false;
    }
    
    if( phone.call != null ) {
        if( phone.call != call || !call.group ) {
            call.signal.reject( peer.user, 'Already in a call' );
            return false;
        }
    }
    
    peer.onicecompleted = function(  ) {
        console.log('> finished ice.');
    };
    
    peer.onremotedescription = function(  ) {
        peer.create_answer();
    };

    peer.onlocaldescription = function(  ) {
        call.signal.answer( peer );
        dVideo.phone.client.ui.chatbook.channel( call.ns ).server_message( 'Call Started' );
        peer.persist();
    };
    
    peer.onclose = function(  ) {
        console.log( '> call closing...' );
        dVideo.phone.hangup( call, peer );
    };
    
    phone.incoming( call, peer );
    

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
        
        if( peer.remote_stream != null )
            return;
        
        var streams = peer.pc.getRemoteStreams();
        
        if( streams.length == 0 )
            return;
        
        console.log('> got a stream');
        peer.remote_stream = streams[0];
        peer.vp.src = URL.createObjectURL( peer.remote_stream );
    };
    
    peer.onlocaldescription = function(  ) {
        call.signal.offer( peer );
    };
    
    peer.onremotedescription = function(  ) {
        // We have our answer here, so everything should be fine and dandy.
        dVideo.phone.client.ui.chatbook.channel( call.ns ).server_message( 'Call Started' );
        peer.persist();
    };
    
    peer.onclose = function(  ) {
        console.log( '> closing call...' );
        dVideo.phone.hangup( call, peer );
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
dVideo.SignalHandler.prototype.close = function( event ) {};