
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
                
    var call = client.bds.peer.open( bds, pns, user, dVideo.APPNAME );
    var peer = call.new_peer( user );
    
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
    
    if( this.call == null ) {
        
        var pnotice = client.ui.pager.notice({
            'ref': 'call-' + peer.user,
            'icon': '<img src="' + wsc.dAmn.avatar.src(peer.user,
                client.channel(call.ns).info.members[peer.user].usericon) + '" />',
            'heading': peer.user + ' calling...',
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
    cui.ulbuf = 500;
    cui.resize();
    
    // Height.
    var height = cui.el.l.p.height();
    var width = cui.el.l.p.width();
    
    console.log( '> sizes', width, 'x', height );
    
    cui.el.l.p.after(
        '<div class="phone private">\
            <div class="viewport remote">\
                <div class="video">\
                    <video autoplay></video>\
                </div>\
                <div class="label">' + peer.user + '</div>\
            </div>\
            <div class="viewport local">\
                <div class="video">\
                    <video autoplay></video>\
                </div>\
                <div class="label">you</div>\
            </div>\
        </div>'
    );
    
    var pui = cui.el.m.find( 'div.phone' );
    pui.height( height );
    
    var rvid = pui.find('.viewport.remote video');
    var lvid = pui.find('.viewport.local video');
    
    if( this.url )
        lvid[0].src = this.url;
    
    call.onlocalstream = function(  ) {
        lvid[0].src = call.localurl;
    };
    
    peer.onremotestream = function(  ) {
    
        rvid[0].src = URL.createObjectURL( peer.remote_stream );
    
    };
    

};

