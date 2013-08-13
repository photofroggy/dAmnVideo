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