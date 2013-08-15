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
