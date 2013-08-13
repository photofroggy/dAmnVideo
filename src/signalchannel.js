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
