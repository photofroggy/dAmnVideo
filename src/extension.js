

dVideo.extension = function( client ) {

    if( !dVideo.RTC.PeerConnection )
        return;
    
    var init = function (  ) {
        
        client.bds.provides.push( 'PEER' );
        dVideo.create_phone( client );
        
        // Event bindings
        client.bind( 'BDS.PEER.REQUEST', function( event ) { dVideo.phone.signal.request( event ); } );
        client.bind( 'BDS.PEER.ACK', function( event ) { dVideo.phone.signal.ack( event ); } );
        client.bind( 'BDS.PEER.REJECT', function( event ) { dVideo.phone.signal.reject( event ); } );
        client.bind( 'BDS.PEER.ACCEPT', function( event ) { dVideo.phone.signal.accept( event ); } );
        client.bind( 'BDS.PEER.OPEN', function( event ) { dVideo.phone.signal.open( event ); } );
        client.bind( 'BDS.PEER.END', function( event ) { dVideo.phone.signal.end( event ); } );
        client.bind( 'BDS.PEER.OFFER', function( event ) { dVideo.phone.signal.offer( event ); } );
        client.bind( 'BDS.PEER.ANSWER', function( event ) { dVideo.phone.signal.answer( event ); } );
        client.bind( 'BDS.PEER.CLOSE', function( event ) { dVideo.phone.signal.close( event ); } );
        
        client.ui.control.add_button({
            label: '',
            icon: 'camera',
            title: 'Start a video call.',
            href: '#call',
            handler: function(  ) { 
                dVideo.create_phone( client );
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