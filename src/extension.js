

dVideo.extension = function( client ) {
    
    if( !dVideo.RTC.PeerConnection )
        return;
    
    var init = function (  ) {
        
        client.bds.provides.push( 'PEER' );
        dVideo.create_phone( client );
        
        // Event bindings
        client.bind( 'peer.request', function( event ) { dVideo.phone.signal.request( event ); } );
        //client.bind( 'BDS.PEER.ACK', function( event ) { dVideo.phone.signal.ack( event ); } );
        //client.bind( 'BDS.PEER.REJECT', function( event ) { dVideo.phone.signal.reject( event ); } );
        client.bind( 'peer.accept', function( event ) { dVideo.phone.signal.accept( event ); } );
        //client.bind( 'BDS.PEER.OPEN', function( event ) { dVideo.phone.signal.open( event ); } );
        //client.bind( 'BDS.PEER.END', function( event ) { dVideo.phone.signal.end( event ); } );
        //client.bind( 'peer.offer', function( event ) { dVideo.phone.signal.offer( event ); } );
        //client.bind( 'peer.answer', function( event ) { dVideo.phone.signal.answer( event ); } );
        client.bind( 'peer.close', function( event ) { dVideo.phone.signal.close( event ); } );
        
        client.ui.control.add_button({
            label: '',
            icon: 'camera',
            title: 'Start a video call.',
            href: '#call',
            handler: function(  ) { 
                var cui = client.ui.chatbook.current;
                
                if( cui.namespace[0] != '@' )
                    return;
                
                var ns = cui.raw;
                var user = cui.namespace.substr(1);
                var title = 'private-call';
                var pns = ns + ':' + title;
                
                var call = client.bds.peer.open( ns, pns, user, dVideo.APPNAME );
                
                var done = function(  ) {
                    call.signal.request( );
                };
                
                dVideo.phone.get_media(
                    function(  ) {
                        // Set as the local stream on the call
                        // and set up a view port.
                        call.localstream = dVideo.phone.stream;
                        // TODO: set up viewport
                    }, done
                );
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
        
    };
    
    init();

};