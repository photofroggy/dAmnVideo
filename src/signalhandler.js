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
    
    if( event.sns[0] != '@' )
        return;
    
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


dVideo.SignalHandler.prototype.open = function( event ) {};

dVideo.SignalHandler.prototype.end = function( event ) {};


/**
 * Handle an offer
 * 
 * @method offer
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.offer = function( event ) {
    
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
 * @method answer
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.answer = function( event ) {
    
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
 * @method candidate
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.candidate = function( event ) {
    
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
 * @method close
 * @param event {Object} Event data
 */
dVideo.SignalHandler.prototype.close = function( event ) {};