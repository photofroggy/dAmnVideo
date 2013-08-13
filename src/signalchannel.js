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
