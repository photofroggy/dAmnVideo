
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
    var phone = this;
    
    
    call.onclose = function(  ) {
    
        phone.call = null;
        var cui = client.ui.chatbook.channel( call.ns );
        if( cui )
            cui.server_message( 'Call Ended' );
    
    };
    
    call.ontimeoud = function(  ) {
    
        var cui = client.ui.chatbook.channel( call.ns );
        
        if( !cui )
            return;
        
        cui.server_message( 'Call Failed', peer.user + ' is not using a compatible client.' );
    
    };
    
    peer.onclose = function(  ) {
    
        call.close();
    
    };
    
    peer.onreject = function( reason ) {
        phone.client.ui.chatbook.channel( call.ns ).server_message( 'Call Rejected', reason );
        phone.hangup( call, peer );
    };
    
    
    var done = function(  ) {
        call.signal.request( );
    };
    
    this.viewport( call, peer );
    
    this.get_media(
        function(  ) {
            call.set_local_stream( dVideo.phone.stream );
            peer.set_local_stream( dVideo.phone.stream );
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
            
            dVideo.phone.hangup( call, peer );
            
            if( !pnotice )
                return;
            
            client.ui.pager.remove_notice( pnotice );
        
        };
    
        peer.onreject = function( reason ) {
            dVideo.phone.client.ui.chatbook.channel( call.ns ).server_message( 'Call Rejected', reason );
            dVideo.phone.hangup( call, peer );
        };
        
        call.onclose = function(  ) {
            
            dVideo.phone.call = null;
            var cui = client.ui.chatbook.channel( call.ns );
            if( cui )
                cui.server_message( 'Call Ended' );
    
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
        var cui = client.ui.chatbook.channel( call.ns );
        if( cui )
            cui.server_message( 'Call Started' );
        
        peer.persist();
    };
    
    peer.onclose = function(  ) {
    
        dVideo.phone.hangup( call, peer );
        
        if( !pnotice )
            return;
        
        client.ui.pager.remove_notice( pnotice );
    
    };
    
    peer.onreject = function( reason ) {
        dVideo.phone.client.ui.chatbook.channel( call.ns ).server_message( 'Call Rejected', reason );
        dVideo.phone.hangup( call, peer );
    };
    
    call.onclose = function(  ) {
    
        dVideo.phone.call = null;
        var cui = client.ui.chatbook.channel( call.ns );
        if( cui )
            cui.server_message( 'Call Ended' );
    
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
            call.set_local_stream( dVideo.phone.stream );
            peer.set_local_stream( dVideo.phone.stream );
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
    
    if( cui ) {
        cui.el.m.find('div.phone').remove();
        cui.ulbuf-= 250;
        cui.resize();
    }
    
    this.call = null;

};

