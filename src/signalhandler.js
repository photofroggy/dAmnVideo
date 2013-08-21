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
        console.log( peer.pc.getRemoteStreams() );
    };
    
    peer.onremotedescription = function(  ) {
        peer.create_answer();
    };

    peer.onlocaldescription = function(  ) {
        call.signal.answer( peer );
    };
    
    peer.onclose = function(  ) {
        dVideo.phone.destroy_call( call );
    };
    
    // TODO: Tell the user about the call.
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
        console.log( peer.pc.getRemoteStreams() );
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
        peer.persist();
    };
    
    peer.onclose = function(  ) {
        dVideo.phone.destroy_call( call );
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