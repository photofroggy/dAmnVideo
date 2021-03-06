

dVideo.extension = function( client ) {
    
    if( !wsc.dAmn.BDS.Peer.RTC.PeerConnection )
        return;
    
    var init = function (  ) {
        
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
        client.bind( 'pkt.part', function( event ) { handle.recv_part( event ); } );
        
        
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