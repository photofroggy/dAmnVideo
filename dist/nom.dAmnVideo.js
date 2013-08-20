
var dVideo = {};
dVideo.VERSION = '0.0.3';
dVideo.STATE = 'alpha';
dVideo.REVISION = '0.0.3';
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
dVideo.RTC = {
    PeerConnection: null,
    SessionDescription: null,
    IceCandidate: null,
}
dVideo._gum = function() {};
dVideo.getUserMedia = function( options, success, error ) {
    return dVideo._gum( options, success, error );
};
if( window.mozRTCPeerConnection ) {
    dVideo.RTC.PeerConnection = mozRTCPeerConnection;
    dVideo.RTC.SessionDescription = mozRTCSessionDescription;
    dVideo.RTC.IceCandidate = mozRTCIceCandidate;
    dVideo._gum = function( options, success, error ) {
        return navigator.mozGetUserMedia( options, success, error );
    };
}
if( window.webkitRTCPeerConnection ) {
    dVideo.RTC.PeerConnection = webkitRTCPeerConnection;
    dVideo._gum = function( options, success, error ) {
        return navigator.webkitGetUserMedia( options, success, error );
    };
}
if( window.RTCPeerConnection ) {
    dVideo.RTC.PeerConnection = RTCPeerConnection;
    dVideo._gum = function( options, success, error ) {
        return navigator.getUserMedia( options, success, error );
    };
}
if( window.RTCSessionDescription ) {
    dVideo.RTC.SessionDescription = RTCSessionDescription;
    dVideo.RTC.IceCandidate = RTCIceCandidate;
}
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
            console.log( error );
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
dVideo.Phone.prototype.incoming = function( pns, user, event ) {
    var client = this.client;
    if( this.call == null ) {
        var pnotice = client.ui.pager.notice({
            'ref': 'call-' + user,
            'icon': '<img src="' + wsc.dAmn.avatar.src(user,
                client.channel(event.ns).info.members[user].usericon) + '" />',
            'heading': user + ' calling...',
            'content': user + ' is calling you.',
            'buttons': {
                'answer': {
                    'ref': 'answer',
                    'target': 'answer',
                    'label': 'Answer',
                    'title': 'Answer the call',
                    'click': function(  ) {
                        client.ui.pager.remove_notice( pnotice );
                        dVideo.phone.answer( event.ns, event.param[2] || event.ns, pns, user );
                        return false;
                    }
                },
                'reject': {
                    'ref': 'reject',
                    'target': 'reject',
                    'label': 'Reject',
                    'title': 'Reject the call',
                    'click': function(  ) {
                        client.npmsg(event.ns, 'BDS:PEER:REJECT:'+pns+',' + user);
                        client.ui.pager.remove_notice( pnotice );
                        return false;
                    }
                }
            }
        }, true );
        pnotice.onclose = function(  ) {
            client.npmsg( event.ns, 'BDS:PEER:REJECT:' + event.user );
        };
        return;
    }
    var peer = this.call.new_peer( pns, user );
    var call = this.call;
    if( !peer ) {
        dVideo.signal.reject( user, 'Permission denied' );
        return;
    }
    if( !this.call.group ) {
        dVideo.signal.accept( user );
        return;
    }
    peer.conn.ready(
        function(  ) {
            dVideo.signal.offer( peer );
        }
    );
};
dVideo.Phone.prototype.answer = function( bds, ns, pns, user ) {
    this.call = new dVideo.Phone.Call( this, bds, ns, pns, user );
    var peer = this.call.new_peer( pns, user );
    if( !peer ) {
        dVideo.signal.reject( user, 'Permission denied' );
        this.call.close();
        this.call = null;
        return;
    }
    dVideo.signal.accept( user );
};
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
dVideo.Phone.Call.prototype.close = function(  ) {
    for( var p in this.peers ) {
        if( !this.peers.hasOwnProperty( p ) )
            continue;
        this.peers[p].conn.close();
    }
};
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
dVideo.Phone.Call.prototype.peer = function( peer ) {
    return this.peers[peer] || null;
};
dVideo.SignalChannel = function( client, bds, pns, ns ) {
    this.user = client.settings.username;
    this.nse = ns ? ',' + ns : '';
    this.bds = this.bds;
    this.pns = this.pns;
    this.ns = ns;
    this.client = client;
};
dVideo.SignalChannel.prototype.command = function(  ) {
    var args = Array.prototype.slice.call(arguments);
    var command = args.shift();
    ',' + args[i];
    }
    this.client.npmsg( this.bds, 'BDS:PEER:' + command + ':' + arg );
};
dVideo.SignalChannel.prototype.request = function(  ) {
    this.command( 'REQUEST', this.user, 'webcam' );
};
dVideo.SignalChannel.prototype.accept = function( auser ) {
    this.command( 'ACCEPT', auser, this.nse );
};
dVideo.SignalChannel.prototype.offer = function( peer ) {
    this.command( 'OFFER', this.user, peer.user, JSON.stringify( peer.conn.offer ) );
};
dVideo.SignalChannel.prototype.answer = function( peer ) {
    this.command( 'ANSWER', this.user, peer.user, JSON.stringify( peer.conn.offer ) );
};
dVideo.SignalChannel.prototype.candidate = function( peer, candidate ) {
    this.command( 'CANDIDATE', this.user, peer.user, JSON.stringify( candidate ) );
};
dVideo.SignalChannel.prototype.reject = function( ruser, reason ) {
    this.command( 'REJECT', ruser, reason );
};
dVideo.SignalChannel.prototype.close = function( cuser ) {
    this.command( 'CLOSE', ( cuser || this.user ) );
};
dVideo.SignalChannel.prototype.list = function( channel ) {
    channel = channel ? ':' + channel : '';
    this.client.npmsg( this.bds, 'BDS:PEER:LIST' + channel );
};
dVideo.SignalHandler = function( phone, client ) {
    this.phone = phone;
    this.client = client;
};
'> finished ice.');
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
dVideo.peer_connection = function( user, remote ) {
    if( !dVideo.RTC.PeerConnection )
        return null;
    return new dVideo.PeerConnection( user, remote );
};
dVideo.PeerConnection = function( user, remote_offer ) {
    this.user = user;
    this.pc = new dVideo.RTC.PeerConnection( dVideo.peer_options );
    this.offer = '';
    this.remote_offer = remote_offer || null;
    this.responding = this.remote_offer != null;
    this.streamed = false;
    this.remote_stream = null;
    this.stream = null;
    this.bindings();
    if( this.remote_offer )
        this.set_remote_description( this.remote_offer );
};
dVideo.PeerConnection.prototype.bindings = function(  ) {
    var pc = this;
    var user = this.user;
    '>> Got an error:', '"', err.message, '"', err );
};
dVideo.PeerConnection.prototype.candidate = function( candidate ) {
    this.pc.addIceCandidate( candidate );
};
dVideo.PeerConnection.prototype.create_offer = function(  ) {
    var pc = this;
    this.pc.createOffer(
        function( description ) { pc.offer_created( description ); },
        function( err ) { pc.onerror( err ); }
    );
};
dVideo.PeerConnection.prototype.offer_created = function( description ) {
    this.offer = description;
    var pc = this;
    this.pc.setLocalDescription( this.offer , function(  ) { pc.local_description_set(); }, this.onerror );
};
dVideo.PeerConnection.prototype.set_remote_description = function( description ) {
    this.remote_offer = description;
    var pc = this;
    this.pc.setRemoteDescription( this.remote_offer , function(  ) { pc.remote_description_set(); }, this.onerror );
};
dVideo.PeerConnection.prototype.local_description_set = function(  ) {
    this.onready();
};
dVideo.PeerConnection.prototype.remote_description_set = function(  ) {
    this.onopen();
};
dVideo.PeerConnection.prototype.answer = function(  ) {
    var pc = this;
    this.responding = true;
    this.pc.createAnswer( 
        function( answer ) { pc.answer_created( answer ); },
        function( err ) { pc.onerror( err ); }
    );
};
dVideo.PeerConnection.prototype.answer_created = function( answer ) {
    this.offer = answer;
    var pc = this;
    this.pc.setLocalDescription( this.offer,
        function(  ) { pc.local_description_set(); },
        function( err ) { pc.onerror( err ); }
    );
};
dVideo.PeerConnection.prototype.set_remote_stream = function( event ) {
    this.remote_stream = event.stream;
    this.onremotestream();
};
dVideo.PeerConnection.prototype.set_remote_stream = function( stream ) {
    this.pc.addStream( stream );
    this.stream = stream;
    this.onlocalstream();
};