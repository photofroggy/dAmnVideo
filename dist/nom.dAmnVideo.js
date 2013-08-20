
var dVideo = {};
dVideo.VERSION = '0.1.4';
dVideo.STATE = 'alpha';
dVideo.REVISION = '0.1.4';
dVideo.APPNAME = 'dAmnVideo 0';
dVideo.bots = [ 'botdom', 'damnphone' ];
dVideo.peer_options = {
    iceServers: [
        { url: 'stun:stun.l.google.com:19302' }
    ]
};
dVideo.phone = null;
dVideo.signal = null;
dVideo.local = {};
dVideo.local.stream = null;
dVideo.local.url = null;
dVideo.remote = {};
dVideo.remote._empty = {
    video: null,
    audio: null,
    conn: null
};
dVideo.chan = {};
dVideo.chan.group = false;
dVideo.chan.calls = [];
dVideo.extension = function( client ) {
    if( !dVideo.RTC.PeerConnection )
        return;
    var init = function (  ) {
        client.bds.provides.push( 'PEER' );
        dVideo.create_phone( client );
        'peer.request', function( event ) { dVideo.phone.signal.request( event ); } );
        'BDS.PEER.ACK', function( event ) { dVideo.phone.signal.ack( event ); } );
        'BDS.PEER.REJECT', function( event ) { dVideo.phone.signal.reject( event ); } );
        client.bind( 'peer.accept', function( event ) { dVideo.phone.signal.accept( event ); } );
        'BDS.PEER.OPEN', function( event ) { dVideo.phone.signal.open( event ); } );
        'BDS.PEER.END', function( event ) { dVideo.phone.signal.end( event ); } );
        'peer.offer', function( event ) { dVideo.phone.signal.offer( event ); } );
        'peer.answer', function( event ) { dVideo.phone.signal.answer( event ); } );
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
                        '<div class="phone"></div>');
    this.view = this.client.ui.view.find('div.phone');
};
dVideo.Phone.prototype.get_media = function( success, err ) {
    var stub = function(  ) {};
    success = success || stub;
    err = err || stub;
    this.client.ui.get_user_media(
        { video: true, audio: true },
        function( stream ) {
            dVideo.phone.got_media( stream );
            success( stream );
        },
        function( error ) {
            err( error );
        }
    );
};
dVideo.Phone.prototype.got_media = function( stream ) {
    dVideo.phone.url = URL.createObjectURL( stream );
    dVideo.phone.stream = stream;
};
dVideo.Phone.prototype.dial = function( bds, pns, ns, host ) {
    if( this.call != null )
        return this.call;
    ns = ns || bds;
    this.call = new dVideo.Phone.Call( this, bds, ns, pns, host );
    dVideo.signal.request(  );
    return this.call;
};
dVideo.Phone.prototype.incoming = function( call, peer ) {
    var client = this.client;
    if( this.call == null ) {
        var pnotice = client.ui.pager.notice({
            'ref': 'call-' + peer.user,
            'icon': '<img src="' + wsc.dAmn.avatar.src(peer.user,
                client.channel(call.ns).info.members[peer.user].usericon) + '" />',
            'heading': peer.user + ' calling...',
            'content': peer.user + ' is calling you.',
            'buttons': {
                'answer': {
                    'ref': 'answer',
                    'target': 'answer',
                    'label': 'Answer',
                    'title': 'Answer the call',
                    'click': function(  ) {
                        client.ui.pager.remove_notice( pnotice );
                        dVideo.phone.answer( call, peer );
                        return false;
                    }
                },
                'reject': {
                    'ref': 'reject',
                    'target': 'reject',
                    'label': 'Reject',
                    'title': 'Reject the call',
                    'click': function(  ) {
                        call.signal.reject( peer.user );
                        client.ui.pager.remove_notice( pnotice );
                        return false;
                    }
                }
            }
        }, true );
        pnotice.onclose = function(  ) {
            call.signal.reject( peer.user );
        };
        return;
    }
    if( !this.call.group )
        return;
    '> finished ice.');
    };
    peer.onlocaldescription = function(  ) {
        console.log('> created offer for',peer.user);
        call.signal.offer( peer );
    };
    peer.onremotedescription = function(  ) {
        '> retrieved answer and connected', peer.user);
        peer.persist();
    };
    peer.create_offer();
};
dVideo.Phone.prototype.answer = function( call, peer ) {
    this.call = call;
    if( call.group )
        return;
    var done = function(  ) {
        if( call.localstream )
            peer.set_local_stream( call.localstream );
        call.signal.accept( peer.user );
    };
    dVideo.phone.get_media(
        function(  ) {
            'You have been blocked' );
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
    };
    console.log('requested',peer.pc.signalingState);
    peer.onremotedescription = function(  ) {
        console.log( '> got offer from',peer.user,', answering');
        peer.create_answer();
    };
    peer.onlocaldescription = function(  ) {
        console.log('> got answer for',peer.user,', sending');
        call.signal.answer( peer );
    };
    '> finished ice.');
    };
    peer.onlocaldescription = function(  ) {
        console.log('> created offer for',peer.user);
        call.signal.offer( peer );
    };
    peer.onremotedescription = function(  ) {
        '> retrieved answer and connected', peer.user);
        peer.persist();
    };
    peer.create_offer();
};
dVideo.SignalHandler.prototype.open = function( event ) {};
dVideo.SignalHandler.prototype.end = function( event ) {};
dVideo.SignalHandler.prototype.offer = function( event ) {
    if( dVideo.APPNAME != event.call.app )
        return;
    var call = event.call;
    var peer = event.peer;
    var offer = event.offer;
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
dVideo.SignalHandler.prototype.close = function( event ) {};