
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
